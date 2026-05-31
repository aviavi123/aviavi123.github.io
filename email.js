// Assemble obfuscated email links at runtime so the address isn't in the page source.
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a.email-link').forEach(function (a) {
        var addr = a.getAttribute('data-user') + '@' + a.getAttribute('data-domain');
        a.setAttribute('href', 'mailto:' + addr);
        if (!a.textContent.trim()) {
            a.textContent = addr;
        }
    });
});
