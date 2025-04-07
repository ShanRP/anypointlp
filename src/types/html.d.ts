
// Add support for non-standard HTML attributes for directory input
interface HTMLInputElement {
  webkitdirectory?: string;
  directory?: string;
  mozDirectory?: string;
}

// These declarations extend React's type definitions
declare namespace React {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
    mozDirectory?: string;
  }
}
