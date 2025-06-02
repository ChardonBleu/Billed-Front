/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

jest.mock("../app/Store", () => mockStore);

// Mock FileList
class MockFileList {
  constructor(files) {
    this.length = files.length;
    for (let i = 0; i < files.length; i++) {
      this[i] = files[i];
    }
  }
}

class MockFile {
  constructor(name, type, size) {
    this.name = name;
    this.type = type;
    this.size = size;
  }
}

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      }),
    );
  });
  describe("When I am on NewBill Page", () => {
    test("Then it should show all inputs", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
      const expenseName = screen.getByTestId("expense-name");
      expect(expenseName).toBeTruthy();
      const expenseType = screen.getByTestId("expense-type");
      expect(expenseType).toBeTruthy();
      const datepicker = screen.getByTestId("datepicker");
      expect(datepicker).toBeTruthy;
      const amount = screen.getByTestId("amount");
      expect(amount).toBeTruthy();
      const vat = screen.getByTestId("vat");
      expect(vat).toBeTruthy();
      const pct = screen.getByTestId("pct");
      expect(pct).toBeTruthy();
      const commentary = screen.getByTestId("commentary");
      expect(commentary).toBeTruthy();
      const file = screen.getByTestId("file");
      expect(file).toBeTruthy();
    });
    test("Then it should show send button", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const button = document.querySelector("#btn-send-bill");
      expect(button).toBeTruthy();
    });
    test("Then it should show file button", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const file = screen.getByTestId("file");
      expect(file).toHaveProperty("type", "file");
    });
    test("Then I can store a file with good type", async () => {
      onNavigate = jest.fn();
      const newBillForm = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = NewBillUI();
      await waitFor(() => screen.getByTestId("form-new-bill"));

      const handleChangeFile = jest.fn(() =>
        newBillForm.handleChangeFile(event),
      );
      const fileInput = screen.getByTestId("file");
      fileInput.addEventListener("change", handleChangeFile);
      const mockFile = new MockFile("test.png", "image/png", 1024);
      const mockFileList = new MockFileList(mockFile);
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
      });
      const event = new Event("change", { bubbles: true });
      fileInput.dispatchEvent(event);
      expect(handleChangeFile).toBeCalled();

      const errorElement = document.querySelector(".file-format-error");
      // expect(errorElement).toBeFalsy()
    });
    test("Then I can't store a file with wrong type", async () => {
      onNavigate = jest.fn();
      const newBillForm = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = NewBillUI();
      await waitFor(() => screen.getByTestId("form-new-bill"));

      const handleChangeFile = jest.fn(() =>
        newBillForm.handleChangeFile(event),
      );
      const fileInput = screen.getByTestId("file");
      fileInput.addEventListener("change", handleChangeFile);
      const file = new File(["dummy content"], "test.pdf", {
        type: "image/png",
      });
      const mockFileList = new MockFileList(file);
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: false,
      });
      const event = new Event("change", { bubbles: true });
      fileInput.dispatchEvent(event);
      const errorElement = document.querySelector(".file-format-error");
      expect(errorElement.innerHTML).toBe(
        `Le fichier doit être au format jpg, jpeg ou png`,
      );
    });
    test("Then I can submit form", () => {});
    test("Then I can update bill", () => {});
  });
});
