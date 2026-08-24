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
 * with [data-license-email], [data-license-get], [data-license-message],
 * [data-license-result], [data-license-key], [data-license-copy] inside it.
 * The download block is optional.
 */
(function () {
    "use strict";

    function setUpLicenseBox(box) {
        const workerURL = box.dataset.worker;
        const productName = box.dataset.productName || "your";

        const emailInput = box.querySelector("[data-license-email]");
        const getButton = box.querySelector("[data-license-get]");
        const message = box.querySelector("[data-license-message]");
        const result = box.querySelector("[data-license-result]");
        const licenseKey = box.querySelector("[data-license-key]");
        const copyButton = box.querySelector("[data-license-copy]");

        if (!workerURL || !emailInput || !getButton || !message || !result || !licenseKey) {
            return;
        }

        async function getLicense() {
            const email = emailInput.value.trim().toLowerCase();

            if (!email) {
                message.textContent =
                    "Please enter the email address you used for your purchase.";
                result.style.display = "none";
                return;
            }

            getButton.disabled = true;
            getButton.textContent = "Looking up license…";
            message.textContent = "";
            result.style.display = "none";

            try {
                const response = await fetch(
                    workerURL + "?email=" + encodeURIComponent(email)
                );

                const data = await response.json();

                if (response.ok && data.found && data.license) {
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
                getButton.textContent = "Get License";
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
