import Swal from "sweetalert2";

export const Alert = Swal.mixin({
  background: "#031114", // bg-bg-dark
  color: "#F0F8FF",      // text-main
  backdrop: "rgba(3, 17, 20, 0.85)",
  confirmButtonColor: "#00FFC2", // accent
  cancelButtonColor: "rgba(255,255,255,0.08)",
  buttonsStyling: false,
  customClass: {
    popup: "quirk-alert-popup",
    title: "quirk-alert-title",
    htmlContainer: "quirk-alert-text",
    confirmButton: "quirk-alert-confirm",
    cancelButton: "quirk-alert-cancel",
  },
});
