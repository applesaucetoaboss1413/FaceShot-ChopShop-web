import "@testing-library/jest-dom";

class MockIntersectionObserver {
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// @ts-expect-error jsdom global augmentation for tests
global.IntersectionObserver = MockIntersectionObserver;
