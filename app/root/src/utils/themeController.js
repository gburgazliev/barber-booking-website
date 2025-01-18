const themeController = () => {
  const localStorageTheme = localStorage.getItem("theme");
  const htmlElement = document.getElementsByTagName("html")[0];
  const inputs = document.getElementsByName("theme-dropdown");

  // Function to update aria-labels for all inputs
  const updateAriaLabels = (currentTheme) => {
    Array.from(inputs).forEach((input) => {
      const themeName = input.value;
      const label = `${themeName.charAt(0).toUpperCase()}${themeName.slice(1)}`;
      input.setAttribute(
        "aria-label",
        themeName === currentTheme ? `${label} (Current)` : label
      );
    });
  };

  // Apply the initial theme and labels
  htmlElement.setAttribute("data-theme", localStorageTheme || "forest");
  updateAriaLabels(localStorageTheme || "forest");

  // Add event listeners to update theme and labels on click
  Array.from(inputs).forEach((input) => {
    input.addEventListener("click", () => {
      const themeName = input.value;
      localStorage.setItem("theme", themeName);
      htmlElement.setAttribute("data-theme", themeName);
      updateAriaLabels(themeName);
    });
  });
};

export default themeController;
