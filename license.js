/*
 * Shared license lookup for the thank-you and recovery pages.
 *
 * Markup contract — one element per page:
 *
 *   <div class="license-box"
 *        data-license-box
 *        data-worker="https://…/get-license"
 *        data-product-name="LP-33 Sim">
 *
 * with [data-license-email], [data-license-get] and [data-license-message]
 * inside it.
 *
 * Two modes:
 *
 *   default   — calls /get-license and reveals the key on the page. Needs
 *               [data-license-result] and [data-license-key]; the copy button
 *               and download block are optional.
 *
 *   data-mode="email"
 *             — calls /email-license, which mails the key instead. Nothing is
 *               revealed, and the same confirmation shows whether or not a
 *               licence exists, so the page never discloses who is a customer.
 */
(function () {
    "use strict";

    const SENT_MESSAGE =
        "If a license exists for that email address, we've sent it to you. " +
        "Please check your inbox and spam/junk folder.";

    function setUpLicenseBox(box) {
        const workerURL = box.dataset.worker;
        const productName = box.dataset.productName || "your";
        const emailMode = box.dataset.mode === "email";

        const emailInput = box.querySelector("[data-license-email]");
        const getButton = box.querySelector("[data-license-get]");
        const message = box.querySelector("[data-license-message]");
        const result = box.querySelector("[data-license-result]");
        const licenseKey = box.querySelector("[data-license-key]");
        const copyButton = box.querySelector("[data-license-copy]");

        if (!workerURL || !emailInput || !getButton || !message) {
            return;
        }

        if (!emailMode && (!result || !licenseKey)) {
            return;
        }

        const buttonLabel = getButton.textContent.trim();

        async function getLicense() {
            const email = emailInput.value.trim().toLowerCase();

            if (!email) {
                message.textContent =
                    "Please enter the email address you used for your purchase.";
                hideResult();
                return;
            }

            getButton.disabled = true;
            getButton.textContent = emailMode ? "Sending…" : "Looking up license…";
            message.textContent = "";
            hideResult();

            try {
                const response = await fetch(
                    workerURL + "?email=" + encodeURIComponent(email)
                );

                const data = await response.json();

                if (emailMode) {
                    // Deliberately identical whether or not a licence was found.
                    message.textContent = response.ok
                        ? SENT_MESSAGE
                        : (data.error || "Unable to send your license. Please try again.");
                } else if (response.ok && data.found && data.license) {
                    licenseKey.textContent = data.license;
                    result.style.display = "block";
                    message.textContent = "License found.";
                } else if (response.status === 404) {
                    message.textContent =
                        "No " + productName + " license was found for that email address. " +
                        "If you just completed your purchase, wait a few seconds and try again.";
                } else {
                    message.textContent =
                        data.error || "Unable to retrieve your license. Please try again.";
                }
            } catch (error) {
                console.error(error);
                message.textContent =
                    "Unable to contact the license server. Please try again.";
            } finally {
                getButton.disabled = false;
                getButton.textContent = buttonLabel;
            }
        }

        function hideResult() {
            if (result) {
                result.style.display = "none";
            }
        }

        getButton.addEventListener("click", getLicense);

        emailInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                getLicense();
            }
        });

        if (copyButton) {
            copyButton.addEventListener("click", async function () {
                const key = licenseKey.textContent.trim();

                if (!key) {
                    return;
                }

                try {
                    await navigator.clipboard.writeText(key);
                    copyButton.textContent = "Copied!";

                    setTimeout(function () {
                        copyButton.textContent = "Copy License";
                    }, 1500);
                } catch (error) {
                    console.error(error);
                    message.textContent =
                        "Couldn't copy automatically. Select the license key above and copy it manually.";
                }
            });
        }
    }

    document.querySelectorAll("[data-license-box]").forEach(setUpLicenseBox);
})();
