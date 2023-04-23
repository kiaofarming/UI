const toggleSidebar = () => {
    document.getElementById("sidebar").classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("toggle-sidebar").addEventListener("click", toggleSidebar);
});
