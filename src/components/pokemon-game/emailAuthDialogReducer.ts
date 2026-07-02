export interface EmailAuthDialogState {
	email: string;
	password: string;
	trainerName: string;
	isSignUp: boolean;
	isResetMode: boolean;
	error: string | null;
	isLoading: boolean;
	successMessage: string | null;
}

export const initialEmailAuthDialogState: EmailAuthDialogState = {
	email: "",
	password: "",
	trainerName: "",
	isSignUp: false,
	isResetMode: false,
	error: null,
	isLoading: false,
	successMessage: null,
};

export type EmailAuthDialogAction =
	| { type: "email_changed"; email: string; clearError: boolean }
	| { type: "password_changed"; password: string }
	| { type: "trainer_name_changed"; trainerName: string }
	| { type: "set_error"; error: string | null }
	| { type: "forgot_password_started" }
	| { type: "forgot_password_succeeded"; message: string }
	| { type: "forgot_password_failed"; error: string }
	| { type: "forgot_password_finished" }
	| { type: "submit_started" }
	| { type: "submit_failed"; error: string }
	| { type: "submit_finished" }
	| { type: "toggle_mode" }
	| { type: "toggle_reset_mode" };

export const emailAuthDialogReducer = (
	state: EmailAuthDialogState,
	action: EmailAuthDialogAction,
): EmailAuthDialogState => {
	switch (action.type) {
		case "email_changed":
			return {
				...state,
				email: action.email,
				error: action.clearError ? null : state.error,
			};
		case "password_changed":
			return { ...state, password: action.password };
		case "trainer_name_changed":
			return { ...state, trainerName: action.trainerName };
		case "set_error":
			return { ...state, error: action.error };
		case "forgot_password_started":
			return { ...state, isLoading: true, error: null, successMessage: null };
		case "forgot_password_succeeded":
			return { ...state, successMessage: action.message };
		case "forgot_password_failed":
			return { ...state, error: action.error };
		case "forgot_password_finished":
			return { ...state, isLoading: false };
		case "submit_started":
			return { ...state, isLoading: true, error: null, successMessage: null };
		case "submit_failed":
			return { ...state, error: action.error };
		case "submit_finished":
			return { ...state, isLoading: false };
		case "toggle_mode":
			return {
				...state,
				isSignUp: !state.isSignUp,
				error: null,
				successMessage: null,
				isResetMode: false,
			};
		case "toggle_reset_mode":
			return {
				...state,
				isResetMode: !state.isResetMode,
				error: null,
				successMessage: null,
			};
	}
};
