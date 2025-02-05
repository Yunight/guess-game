import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/i18n";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	return (
		<Provider store={store}>
			<I18nextProvider i18n={i18n}>{children}</I18nextProvider>
		</Provider>
	);
};

const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };
