/**
 * Global styles to hide the scrollbar while keeping the scroll functionality.
 * This is added as a CSS string to be injected or you can add it to your index.css.
 */
const hideScrollbarStyles = `
  body {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  body::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
`;

export function GlobalStyles() {
  return (
    <style>{hideScrollbarStyles}</style>
  );
}
