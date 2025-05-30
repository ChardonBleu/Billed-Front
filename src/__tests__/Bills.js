/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js"
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

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
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toHaveClass('active-icon')
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByTestId("billsUIDate")
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    test("Then bills status should appear in French for each bill", async () => {
      const newBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const newFrenchBills = await newBills.getBills()
      expect(newFrenchBills.map((bill) => bill.status)).toStrictEqual(["En attente","Refusé","Accepté","Refusé"])

    });
  });
  describe("When I am on Bills Page and i click on eye icon", () => {
    test("Then modal file opens", async () => {
      $.fn.modal = jest.fn();

      const testBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      document.body.innerHTML =  BillsUI({ data: bills })
      await waitFor(() => screen.getByTestId("tbody"))

      const iconEye1 = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        testBills.handleClickIconEye(iconEye1)
      );     

      iconEye1.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye1);
      expect($.fn.modal).toHaveBeenCalledWith('show');

      const eyebuttons = screen.getAllByTestId("icon-eye")
      userEvent.click(eyebuttons[0])
      expect(handleClickIconEye).toHaveBeenCalled()
      await waitFor(() => screen.getByAltText("Bill"))
      const fileImg = screen.getByAltText("Bill")
      expect(fileImg).toHaveAttribute("src", expect.stringContaining("https://test.storage"))

    });
  });
  describe("When I am on Bills Page and i click on new Bill button", () => {
    test("Then new bill Form is open", async () => {
      const onNavigate = jest.fn();
      const testBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      document.body.innerHTML =  BillsUI({ data: bills })
      await waitFor(() => screen.getByTestId("btn-new-bill"))

      const newBillButton = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn(() =>
        testBills.handleClickNewBill()
      );
      newBillButton.addEventListener("click", handleClickNewBill);
      userEvent.click(newBillButton);
      expect(onNavigate).toBeCalledWith(ROUTES_PATH["NewBill"])
    });
  });
});


// test d'intégration GET
describe("Given I am a user connected as employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" }),
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentTitle = screen.getByText("Mes notes de frais");
      expect(contentTitle).toBeTruthy();
      const tbody = screen.getAllByTestId("tbody")
      expect(tbody).toBeTruthy();
      const allrows = document.querySelectorAll("tbody tr")
      expect(allrows.length).toBe(4)
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          }),
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
