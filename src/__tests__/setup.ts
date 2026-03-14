import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrollIntoView -- mock it globally
window.HTMLElement.prototype.scrollIntoView = function () {}
