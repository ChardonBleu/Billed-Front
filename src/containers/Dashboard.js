import { formatDate } from "../app/format.js";
import DashboardFormUI from "../views/DashboardFormUI.js";
import BigBilledIcon from "../assets/svg/big_billed.js";
import { ROUTES_PATH } from "../constants/routes.js";
import USERS_TEST from "../constants/usersTest.js";
import Logout from "./Logout.js";

export const filteredBills = (data, status) => {
  return data && data.length
    ? data.filter((bill) => {
        let selectCondition;

        // in jest environment
        if (typeof jest !== "undefined") {
          selectCondition = bill.status === status;
        } else {
          /* istanbul ignore next */
          // in prod environment
          const userEmail = JSON.parse(localStorage.getItem("user")).email;
          selectCondition =
            bill.status === status &&
            ![...USERS_TEST, userEmail].includes(bill.email);
        }

        return selectCondition;
      })
    : [];
};

export const card = (bill) => {
  const firstAndLastNames = bill.email.split("@")[0];
  const firstName = firstAndLastNames.includes(".")
    ? firstAndLastNames.split(".")[0]
    : "";
  const lastName = firstAndLastNames.includes(".")
    ? firstAndLastNames.split(".")[1]
    : firstAndLastNames;

  return `
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `;
};

export const cards = (bills) => {
  return bills && bills.length ? bills.map((bill) => card(bill)).join("") : "";
};

export const getStatus = (index) => {
  switch (index) {
    case 1:
      return "pending";
    case 2:
      return "accepted";
    case 3:
      return "refused";
  }
};

export default class {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    $("#arrow-icon1").on("click", () => this.handleShowTickets(bills, 1));
    $("#arrow-icon2").on("click", () => this.handleShowTickets(bills, 2));
    $("#arrow-icon3").on("click", () => this.handleShowTickets(bills, 3));
    new Logout({ localStorage, onNavigate });
  }

  handleClickIconEye = () => {
    const billUrl = $("#icon-eye-d").attr("data-bill-url");
    $("#modaleFileAdmin1")
      .find(".modal-body")
      .html(
        `<div class="object-cover text-center"><img width="100%" src=${billUrl} alt="Bill" class="object-cover w-full"/></div>`,
      );
    if (typeof $("#modaleFileAdmin1").modal === "function")
      $("#modaleFileAdmin1").modal("show");
    const closeBtn = document.querySelector(".close");
    closeBtn.addEventListener("click", () =>
      $("#modaleFileAdmin1").modal("hide"),
    );
  };

  handleEditTicket(bill, bills) {
    if (this.counter === undefined || this.id !== bill.id) this.counter = 0;
    if (this.id === undefined || this.id !== bill.id) this.id = bill.id;
    if (this.counter % 2 === 0) {
      bills.forEach((b) => {
        $(`#open-bill${b.id}`).css({ background: "#0D5AE5" });
      });
      $(`#open-bill${bill.id}`).css({ background: "#2A2B35" });
      $(".dashboard-right-container div").html(DashboardFormUI(bill));
      $(".vertical-navbar").css({ height: "150vh" });
      this.counter++;
    } else {
      $(`#open-bill${bill.id}`).css({ background: "#0D5AE5" });

      $(".dashboard-right-container div").html(`
        <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `);
      $(".vertical-navbar").css({ height: "120vh" });
      this.counter++;
    }
    $("#icon-eye-d").on("click", this.handleClickIconEye);
    $("#btn-accept-bill").on("click", () => this.handleAcceptSubmit(bill));
    $("#btn-refuse-bill").on("click", () => this.handleRefuseSubmit(bill));
  }

  handleAcceptSubmit = (bill) => {
    const newBill = {
      ...bill,
      status: "accepted",
      commentAdmin: $("#commentary2").val(),
    };
    this.updateBill(newBill);
    this.onNavigate(ROUTES_PATH["Dashboard"]);
  };

  handleRefuseSubmit = (bill) => {
    const newBill = {
      ...bill,
      status: "refused",
      commentAdmin: $("#commentary2").val(),
    };
    this.updateBill(newBill);
    this.onNavigate(ROUTES_PATH["Dashboard"]);
  };

  handleShowTickets(bills, index) {
    if (this.counter === undefined || this.index !== index) this.counter = 0;
    if (this.index === undefined || this.index !== index) this.index = index;
    let currentBills = filteredBills(bills, getStatus(this.index));
    if (this.counter % 2 === 0) {
      $(`#arrow-icon${this.index}`).addClass("arrow-down");
      $(`#status-bills-container${this.index}`).html(cards(currentBills));
      this.counter++;
    } else {
      $(`#arrow-icon${this.index}`).removeClass("arrow-down");
      $(`#status-bills-container${this.index}`).html("");
      this.counter++;
    }

    currentBills.forEach((bill) => {
      $(`#open-bill${bill.id}`).on("click", () => {
        this.handleEditTicket(bill, bills);
      });
    });

    return bills;
  }

  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then((snapshot) => {
          const bills = snapshot.map((doc) => ({
            id: doc.id,
            ...doc,
            date: doc.date,
            status: doc.status,
          }));
          return bills;
        })
        .catch((error) => {
          throw error;
        });
    }
  };

  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      return this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: bill.id })
        .then((bill) => bill)
        .catch();
    }
  };
}
