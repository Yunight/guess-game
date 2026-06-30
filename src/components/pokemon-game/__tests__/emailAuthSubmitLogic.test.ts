import { describe, expect, it, vi } from "vitest";
import { executeEmailAuthSubmit } from "../emailAuthSubmitLogic";

describe("executeEmailAuthSubmit", () => {
	it("returns validation error for missing trainer name on sign up", async () => {
		const result = await executeEmailAuthSubmit(
			{
				isSignUp: true,
				email: "ash@example.com",
				password: "secret",
				trainerName: " ",
				hasError: false,
			},
			{
				createUser: vi.fn(),
				signIn: vi.fn(),
				updateDisplayName: vi.fn(),
				persistPlayerName: vi.fn(),
				reloadPage: vi.fn(),
				translateError: (code) => code,
				translateValidation: (key) => key,
			},
		);

		expect(result.status).toBe("validation_failed");
	});

	it("creates a user on successful sign up", async () => {
		const createUser = vi.fn().mockResolvedValue({ user: { displayName: null } });
		const updateDisplayName = vi.fn().mockResolvedValue(undefined);
		const persistPlayerName = vi.fn();
		const reloadPage = vi.fn();

		const result = await executeEmailAuthSubmit(
			{
				isSignUp: true,
				email: "ash@example.com",
				password: "secret",
				trainerName: "Ash",
				hasError: false,
			},
			{
				createUser,
				signIn: vi.fn(),
				updateDisplayName,
				persistPlayerName,
				reloadPage,
				translateError: (code) => code,
				translateValidation: (key) => key,
			},
		);

		expect(result.status).toBe("success");
		expect(createUser).toHaveBeenCalled();
		expect(persistPlayerName).toHaveBeenCalledWith("Ash");
	});
});
