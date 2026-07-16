/* Rabie Panelbeaters - enquiry engine.
   Composes a WhatsApp / email message from the form fields and opens the
   visitor's own WhatsApp or mail client. Nothing is stored or sent by the site.
   Pure functions are exported for node tests (tools/enquiry.test.mjs). */
(function (global) {
  "use strict";

  var WHATSAPP_NUMBER = "27744418900";
  var EMAIL_ADDRESS = "rabiepanelbeaterssa@gmail.com";

  function contactLine(phone, email) {
    return [phone, email].filter(Boolean).join(" or ");
  }

  function composeMessage(data) {
    var contact = contactLine(data.phone, data.email);
    if (data.type === "quote") {
      return (
        "Hi Rabie Panelbeaters, my name is " + data.name + ".\n" +
        "I'd like to request a quote for my " + data.vehicle + ".\n" +
        "Damage details: " + data.message + "\n" +
        "Please contact me on " + contact + " to arrange an assessment. Thank you."
      );
    }
    return (
      "Hi Rabie Panelbeaters, my name is " + data.name + ".\n" +
      "I'd love your assistance with: " + data.message + "\n" +
      "Please contact me on " + contact + " and promptly assist. Thank you."
    );
  }

  function composeSubject(data) {
    if (data.type === "quote") {
      return "Quote Request - " + data.vehicle + " - " + data.name;
    }
    return "Enquiry - " + data.name;
  }

  function whatsappUrl(message) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  function emailUrl(subject, body) {
    return "mailto:" + EMAIL_ADDRESS +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  var api = {
    composeMessage: composeMessage,
    composeSubject: composeSubject,
    whatsappUrl: whatsappUrl,
    emailUrl: emailUrl
  };
  global.RPB = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- DOM layer ---------- */
  if (typeof document === "undefined") return;

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("enquiry-form");
    if (!form) return;

    var fields = {
      name: document.getElementById("enq-name"),
      phone: document.getElementById("enq-phone"),
      email: document.getElementById("enq-email"),
      vehicle: document.getElementById("enq-vehicle"),
      message: document.getElementById("enq-message")
    };
    var vehicleField = fields.vehicle ? fields.vehicle.closest(".field") : null;
    var messageLabelText = document.getElementById("enq-message-label-text");
    var preview = document.getElementById("enq-preview");
    var btnWhatsApp = document.getElementById("send-whatsapp");
    var btnEmail = document.getElementById("send-email");

    function currentType() {
      var checked = form.querySelector('input[name="enq-type"]:checked');
      return checked ? checked.value : (form.getAttribute("data-default-type") || "enquiry");
    }

    function collect() {
      return {
        type: currentType(),
        name: fields.name.value.trim(),
        phone: fields.phone.value.trim(),
        email: fields.email.value.trim(),
        vehicle: fields.vehicle ? fields.vehicle.value.trim() : "",
        message: fields.message.value.trim()
      };
    }

    function previewData(data) {
      // Show helpful placeholders in the live preview until fields are filled
      return {
        type: data.type,
        name: data.name || "(your name)",
        phone: data.phone,
        email: data.phone || data.email ? data.email : "(your phone or email)",
        vehicle: data.vehicle || "(your vehicle)",
        message: data.message || (data.type === "quote" ? "(damage description)" : "(your enquiry)")
      };
    }

    function updateTypeUI() {
      var isQuote = currentType() === "quote";
      if (vehicleField) {
        vehicleField.hidden = !isQuote;
        if (fields.vehicle) fields.vehicle.required = isQuote;
      }
      if (messageLabelText) {
        messageLabelText.textContent = isQuote ? "Describe the damage" : "How can we help?";
      }
      updatePreview();
    }

    function updatePreview() {
      if (!preview) return;
      preview.textContent = composeMessage(previewData(collect()));
    }

    function setError(input, key, msg) {
      var err = form.querySelector('.field__error[data-for="' + key + '"]');
      if (err) {
        err.textContent = msg || "";
        err.classList.toggle("is-visible", Boolean(msg));
      }
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    function validate(data) {
      var firstInvalid = null;
      function flag(input, key, msg) {
        setError(input, key, msg);
        if (msg && !firstInvalid) firstInvalid = input;
      }
      flag(fields.name, "name", data.name ? "" : "Please enter your name.");
      var hasContact = Boolean(data.phone || data.email);
      flag(fields.phone, "phone", hasContact ? "" : "Add a phone number or an email address so we can reach you.");
      if (fields.email) fields.email.setAttribute("aria-invalid", hasContact ? "false" : "true");
      if (data.type === "quote") {
        flag(fields.vehicle, "vehicle", data.vehicle ? "" : "Tell us the vehicle make and model.");
      } else {
        setError(fields.vehicle, "vehicle", "");
      }
      flag(fields.message, "message", data.message ? "" : (data.type === "quote" ? "Describe the damage so we can quote accurately." : "Tell us how we can help."));
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    }

    function send(channel) {
      var data = collect();
      if (!validate(data)) return;
      var msg = composeMessage(data);
      if (channel === "whatsapp") {
        window.open(whatsappUrl(msg), "_blank", "noopener");
      } else {
        window.location.href = emailUrl(composeSubject(data), msg);
      }
    }

    form.addEventListener("input", updatePreview);
    form.addEventListener("submit", function (e) { e.preventDefault(); send("whatsapp"); });
    Array.prototype.forEach.call(form.querySelectorAll('input[name="enq-type"]'), function (radio) {
      radio.addEventListener("change", updateTypeUI);
    });
    if (btnWhatsApp) btnWhatsApp.addEventListener("click", function () { send("whatsapp"); });
    if (btnEmail) btnEmail.addEventListener("click", function () { send("email"); });

    updateTypeUI();
  });
})(typeof window !== "undefined" ? window : globalThis);
