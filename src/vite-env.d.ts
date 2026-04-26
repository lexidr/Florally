/// <reference types="vite/client" />

// Для CSS-файлов
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Для SCSS/SASS
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

// Для LESS
declare module '*.less' {
  const content: { [className: string]: string };
  export default content;
}