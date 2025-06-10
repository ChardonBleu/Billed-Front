/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import * as formatModule from "../app/format.js";

jest.mock("../app/Store", () => mockStore);
let onNavigate;

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
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

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toHaveClass("active-icon");
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
    test("Then getBills method return store bills", async () => {
      const newBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const newFrenchBills = await newBills.getBills();
      expect(newFrenchBills[0]).toEqual(
        {
          id: '47qAXb6fIm2zOKkLzMro',
          vat: '80',
          fileUrl: 'https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
          status: 'En attente',
          type: 'Hôtel et logement',
          commentary: 'séminaire billed',
          name: 'encore',
          fileName: 'preview-facture-free-201801-pdf-1.jpg',
          date: '2004-04-04',
          amount: 400,
          commentAdmin: 'ok',
          email: 'a@a',
          pct: 20
        }
      )
      expect(newFrenchBills.length).toBe(4)
    });
    test("Then bills status should appear in French for each bill", async () => {
      const newBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const newFrenchBills = await newBills.getBills();
      expect(newFrenchBills.map((bill) => bill.status)).toStrictEqual([
        "En attente",
        "Refusé",
        "Accepté",
        "Refusé",
      ]);
    });
    test("Then bills can't appear because of API 500 error", async () => {
      jest.spyOn(formatModule, "formatStatus").mockImplementation(() => {
        throw new Error("formatage impossible");
      });

      const newBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      await expect(newBills.getBills()).rejects.toThrow("formatage impossible");
    });
  });
  describe("When I am on Bills Page and i click on eye icon", () => {
    test("Then modal file opens", async () => {
      $.fn.modal = jest.fn();

      const newBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = BillsUI({ data: bills });

      await waitFor(() => screen.getByTestId("tbody"));

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        newBills.handleClickIconEye(iconEye),
      );

      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);
      expect($.fn.modal).toHaveBeenCalledWith("show");
      expect(handleClickIconEye).toHaveBeenCalled();
      await waitFor(() => screen.getByAltText("Bill"));
      const fileImg = screen.getByAltText("Bill");
      expect(fileImg).toHaveAttribute(
        "src",
        expect.stringContaining("https://test.storage"),
      );
    });
  });
  describe("When I am on Bills Page and modal file open and I click on close icon", () => {
    test("Then modal file closes", async () => {
      $.fn.modal = jest.fn();

      const newBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = BillsUI({ data: bills });

      await waitFor(() => screen.getByTestId("tbody"));

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        newBills.handleClickIconEye(iconEye),
      );

      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);
      expect($.fn.modal).toHaveBeenCalledWith("show");
      expect(handleClickIconEye).toHaveBeenCalled();
      await waitFor(() => screen.getByAltText("Bill"));
      const closeIcon = document.querySelector(".close");
      closeIcon.addEventListener("click", handleClickIconEye);
      userEvent.click(closeIcon);
      expect($.fn.modal).toHaveBeenCalledWith("hide");
    });
  });
  describe("When I am on Bills Page and I click on new Bill button", () => {
    test("Then new bill Form is open", async () => {
      const newBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      document.body.innerHTML = BillsUI({ data: bills });
      await waitFor(() => screen.getByTestId("btn-new-bill"));

      const newBillButton = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn(() => newBills.handleClickNewBill());
      newBillButton.addEventListener("click", handleClickNewBill);
      userEvent.click(newBillButton);
      expect(onNavigate).toBeCalledWith(ROUTES_PATH["NewBill"]);
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as employee", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentTitle = screen.getByText("Mes notes de frais");
      expect(contentTitle).toBeTruthy();
      const tbody = screen.getByTestId("tbody");
      expect(tbody).toBeTruthy();
      const allrows = document.querySelectorAll("tbody tr");
      expect(allrows.length).toBe(4);
    });
    describe("When an error occurs on API", () => {
      test("fetches bills from API and fails with 404 message error", async () => {
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
      test("fetches messages from API and fails with 500 message error", async () => {
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
