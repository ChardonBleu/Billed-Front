import { ROUTES_PATH } from "../constants/routes.js";
import { formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const buttonNewBill = document.querySelector(
      `button[data-testid="btn-new-bill"]`,
    );
    if (buttonNewBill)
      buttonNewBill.addEventListener("click", this.handleClickNewBill);
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => this.handleClickIconEye(icon));
      });
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    $("#modaleFile")
      .find(".modal-body")
      .html(
        `<div class="object-cover text-center"><img width="100%" src=${billUrl} alt="Bill" class="object-cover w-full"/></div>`,
      );
    $("#modaleFile").modal("show");
  };

  getBills = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then((snapshot) => {
          const bills = snapshot.map((doc) => {
            try {
              return {
                ...doc,
                status: formatStatus(doc.status),
              };
            } catch (e) {
              throw new Error(e, "for", doc);
            }
          });
          return bills;
        });
    }
  };
}
