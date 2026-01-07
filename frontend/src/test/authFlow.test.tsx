import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import { Navbar } from "@/components/layout/Navbar";
import { PricingSection } from "@/components/landing/PricingSection";
import SignupPage from "@/pages/Signup";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

vi.mock("@/lib/api", async (original) => {
  const actual = await original();
  return {
    ...actual,
    api: {
      ...actual.api,
      login: vi.fn(),
      signup: vi.fn(),
      getCurrentUser: vi.fn(),
      getToken: vi.fn(),
      setToken: vi.fn(),
      getPricingPlans: vi.fn(),
      createCheckoutSession: vi.fn(),
    },
  };
});

const mockedApi = api as unknown as {
  login: ReturnType<typeof vi.fn>;
  signup: ReturnType<typeof vi.fn>;
  getCurrentUser: ReturnType<typeof vi.fn>;
  getToken: ReturnType<typeof vi.fn>;
  setToken: ReturnType<typeof vi.fn>;
  getPricingPlans: ReturnType<typeof vi.fn>;
  createCheckoutSession: ReturnType<typeof vi.fn>;
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("Auth flow", () => {
  beforeEach(() => {
    mockedApi.login.mockReset();
    mockedApi.signup.mockReset();
    mockedApi.getCurrentUser.mockReset();
    mockedApi.getToken.mockReset();
    mockedApi.setToken.mockReset();
    mockedApi.getPricingPlans.mockReset();
    mockedApi.createCheckoutSession.mockReset();
  });

  it("handles successful login", async () => {
    mockedApi.getToken.mockReturnValue(null);
    mockedApi.getCurrentUser.mockResolvedValue({ success: false });
    mockedApi.login.mockResolvedValue({
      success: true,
      data: {
        token: "token",
        user: { id: "1", email: "user@example.com", credits: 0, createdAt: new Date().toISOString() },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const outcome = await result.current.login("user@example.com", "password");
      expect(outcome.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe("user@example.com");
  });

  it("handles invalid credentials on login", async () => {
    mockedApi.getToken.mockReturnValue(null);
    mockedApi.getCurrentUser.mockResolvedValue({ success: false });
    mockedApi.login.mockResolvedValue({
      success: false,
      error: "invalid_credentials",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const outcome = await result.current.login("user@example.com", "wrong");
      expect(outcome.success).toBe(false);
      expect(outcome.error).toBe("invalid_credentials");
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it("handles network failure on login", async () => {
    mockedApi.getToken.mockReturnValue(null);
    mockedApi.getCurrentUser.mockResolvedValue({ success: false });
    mockedApi.login.mockResolvedValue({
      success: false,
      error: "Network error",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const outcome = await result.current.login("user@example.com", "password");
      expect(outcome.success).toBe(false);
      expect(outcome.error).toBe("Network error");
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it("handles successful signup", async () => {
    mockedApi.getToken.mockReturnValue(null);
    mockedApi.getCurrentUser.mockResolvedValue({ success: false });
    mockedApi.signup.mockResolvedValue({
      success: true,
      data: {
        token: "token",
        user: { id: "2", email: "new@example.com", credits: 0, createdAt: new Date().toISOString() },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const outcome = await result.current.signup("new@example.com", "password");
      expect(outcome.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe("new@example.com");
  });

  it("handles session timeout via refreshUser", async () => {
    mockedApi.getToken.mockReturnValue("expired");
    mockedApi.getCurrentUser.mockResolvedValue({
      success: false,
      error: "invalid_token",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe("Pricing navigation", () => {
  beforeEach(() => {
    mockedApi.getPricingPlans.mockReset();
    mockedApi.createCheckoutSession.mockReset();
  });

  it("routes unauthenticated users to signup with plan parameter", async () => {
    mockedApi.getPricingPlans.mockResolvedValue({
      success: true,
      data: [
        {
          id: "starter-id",
          code: "starter",
          name: "Starter",
          monthlyPriceUsd: 9,
          includedSeconds: 300,
          description: "Starter plan",
        },
      ],
    });

    const initialEntries = ["/pricing"];

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/pricing" element={<PricingSection />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    const button = await screen.findByRole("button", { name: /get started/i });
    fireEvent.click(button);

    expect(screen.getByText(/Selected: Starter Plan/i)).toBeInTheDocument();
  });
});

describe("Landing navigation", () => {
  beforeEach(() => {
    (window as any).scrollTo = vi.fn();
  });

  it("renders header nav links with correct hashes", () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Navbar />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Face Swap").closest("a")).toHaveAttribute("href", "/#face-swap");
    expect(screen.getByText("AI Avatars").closest("a")).toHaveAttribute("href", "/#ai-avatars");
    expect(screen.getByText("Image to Video").closest("a")).toHaveAttribute("href", "/#image-to-video");
    expect(screen.getByText("One-Click Magic").closest("a")).toHaveAttribute("href", "/#one-click-magic");
    expect(screen.getByText("Secure & Private").closest("a")).toHaveAttribute("href", "/#secure-private");
    expect(screen.getByText("Pricing").closest("a")).toHaveAttribute("href", "/#pricing");
  });

  it("scrolls to section when loaded with hash", () => {
    const scrollIntoView = vi.fn();

    const target = document.createElement("div");
    target.id = "face-swap";
    (target as any).scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/#face-swap"]}>
          <Index />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(scrollIntoView).toHaveBeenCalled();
  });
});
