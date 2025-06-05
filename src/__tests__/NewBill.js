/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";

jest.mock("../app/Store", () => mockStore);
let onNavigate;
let newBillForm;
let handleChangeFile;

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    jest.spyOn(mockStore, "bills");
    onNavigate = jest.fn();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@employee",
      }),
    );
  });
  beforeEach(() => {
    document.body.innerHTML = NewBillUI();
  });
  describe("When I am on NewBill Page", () => {
    test("Then it should show all inputs", () => {
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
      const button = document.querySelector("#btn-send-bill");
      expect(button).toBeTruthy();
    });
    test("Then it should show file button", () => {
      const file = screen.getByTestId("file");
      expect(file).toHaveProperty("type", "file");
    });
  });

  describe("When I am on NewBill Page with empty form", () => {
    beforeEach(() => {
      newBillForm = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    test("Then I can store a file with good type", async () => {
      const mockFilePng = new File(["file content"], "image.png", {
        type: "image/png",
      });
      const event = {
        target: {
          files: [mockFilePng],
          value: mockFilePng.name,
        },
        preventDefault: jest.fn(),
      };
      handleChangeFile = jest.fn(() => newBillForm.handleChangeFile(event));
      await waitFor(() => screen.getByTestId("form-new-bill"));
      const fileInput = screen.getByTestId("file");
      Object.defineProperty(fileInput, "files", {
        value: [mockFilePng],
        writable: false,
      });
      fileInput.addEventListener("change", handleChangeFile);
      fileInput.dispatchEvent(new Event("change"));

      expect(handleChangeFile).toBeCalled();

      const errorElement = document.querySelector(".file-format-error");
      expect(errorElement.innerHTML).toBe(``);
    });

    test("Then I can't store a file with wrong type", async () => {
      const mockFileTxt = new File(["file content"], "text.txt", {
        type: "text/plain",
      });
      const event = {
        target: {
          files: [mockFileTxt],
          value: mockFileTxt.name,
        },
        preventDefault: jest.fn(),
      };
      handleChangeFile = jest.fn(() => newBillForm.handleChangeFile(event));
      await waitFor(() => screen.getByTestId("form-new-bill"));
      const fileInput = screen.getByTestId("file");
      fileInput.addEventListener("change", handleChangeFile);
      Object.defineProperty(fileInput, "files", {
        value: [mockFileTxt],
        writable: false,
      });

      fileInput.dispatchEvent(new Event("change"));
      expect(handleChangeFile).toBeCalled();

      const errorElement = document.querySelector(".file-format-error");
      expect(errorElement.innerHTML).toBe(
        `Le fichier doit être au format jpg, jpeg ou png`,
      );
    });

    test("Then I can submit form with required fields", async () => {
      await waitFor(() => screen.getByTestId("form-new-bill"));
      newBillForm.fileUrl = "https://mycloud/image/png";
      newBillForm.fileName = "image/png";
      screen.getByTestId("datepicker").value = "2025-06-01";
      screen.getByTestId("amount").value = 200;
      const form = screen.getByTestId("form-new-bill");

      const event = {
        target: form,
        preventDefault: jest.fn(),
      };
      handleSubmit = jest.fn(() => newBillForm.handleSubmit(event));
      form.addEventListener("submit", handleSubmit);
      form.dispatchEvent(new Event("submit"));

      expect(handleSubmit).toBeCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
    test("Then I can't submit form without required fields", async () => {
      await waitFor(() => screen.getByTestId("form-new-bill"));
      const form = screen.getByTestId("form-new-bill");

      const event = {
        target: form,
        preventDefault: jest.fn(),
      };
      handleSubmit = jest.fn(() => newBillForm.handleSubmit(event));
      form.addEventListener("submit", handleSubmit);
      form.dispatchEvent(new Event("submit"));

      expect(handleSubmit).toBeCalled();
      expect(onNavigate).not.toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });

    test("POST bills to mock API", async () => {
      await waitFor(() => screen.getByTestId("form-new-bill"));
      newBillForm.fileUrl = "https://mycloud/image/png";
      newBillForm.fileName = "image.png";
      screen.getByTestId("expense-name").value = "Déplacement";
      screen.getByTestId("expense-type").value = "Restaurants et bars";
      screen.getByTestId("datepicker").value = "2025-06-01";
      screen.getByTestId("amount").value = "100";
      screen.getByTestId("vat").value = "20";
      screen.getByTestId("pct").value = "20";
      screen.getByTestId("commentary").value = "RAS";

      const form = screen.getByTestId("form-new-bill");

      const updateSpy = jest.spyOn(mockStore.bills(), "update");
      form.dispatchEvent(new Event("submit"));

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
      expect(updateSpy).toHaveBeenCalledWith({
        data: JSON.stringify({
          type: "Restaurants et bars",
          name: "Déplacement",
          amount: 100,
          date: "2025-06-01",
          vat: "20",
          pct: 20,
          commentary: "RAS",
          fileUrl: "https://mycloud/image/png",
          fileName: "image.png",
          status: "pending",
        }),
        selector: null,
      });
    });

    test("POST bills fails", async () => {
      await waitFor(() => screen.getByTestId("form-new-bill"));
      newBillForm.fileUrl = "https://mycloud/image/png";
      newBillForm.fileName = "image/png";
      screen.getByTestId("datepicker").value = "2025-06-01";
      screen.getByTestId("amount").value = "100";
      screen.getByTestId("pct").value = "20";
      const form = screen.getByTestId("form-new-bill");

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      form.dispatchEvent(new Event("submit"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledTimes(1);
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Erreur 500" }),
      );
    });
  });
  describe("When I am on NewBill Page and I store a new file in file input", () => {
    test("Then bills creation with file throw an error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const mockFilePng = new File(["file content"], "image.png", {
        type: "image/png",
      });
      const event = {
        target: {
          files: [mockFilePng],
          value: mockFilePng.name,
        },
        preventDefault: jest.fn(),
      };
      await waitFor(() => screen.getByTestId("form-new-bill"));
      const fileInput = screen.getByTestId("file");
      Object.defineProperty(fileInput, "files", {
        value: [mockFilePng],
        writable: false,
      });
      handleChangeFile = jest.fn(() => newBillForm.handleChangeFile(event));

      fileInput.addEventListener("change", handleChangeFile);
      fileInput.dispatchEvent(new Event("change"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledTimes(1);
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Erreur 500" }),
      );

      jest.clearAllMocks();
    });
  });
});
