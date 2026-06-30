import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "../../../test/test-utils";
import { EmailAuthForm } from "../EmailAuthForm";

describe("EmailAuthForm", () => {
	it("renders sign in form by default", () => {
		render(
			<EmailAuthForm
				email=""
				password=""
				trainerName=""
				isSignUp={false}
				isLoading={false}
				onEmailChange={vi.fn()}
				onPasswordChange={vi.fn()}
				onTrainerNameChange={vi.fn()}
				onSubmit={vi.fn((event) => event.preventDefault())}
				onForgotPassword={vi.fn()}
				onToggleMode={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText("email")).toBeInTheDocument();
		expect(screen.getByText("signIn")).toBeInTheDocument();
	});

	it("renders trainer name field in sign up mode", () => {
		render(
			<EmailAuthForm
				email=""
				password=""
				trainerName=""
				isSignUp={true}
				isLoading={false}
				onEmailChange={vi.fn()}
				onPasswordChange={vi.fn()}
				onTrainerNameChange={vi.fn()}
				onSubmit={vi.fn((event) => event.preventDefault())}
				onForgotPassword={vi.fn()}
				onToggleMode={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText("trainerName")).toBeInTheDocument();
		fireEvent.click(screen.getByText("alreadyHaveAccount"));
	});
});
