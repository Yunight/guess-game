import { Component, type ReactNode, type ErrorInfo } from "react";

import { ErrorBoundaryFallback } from "./ErrorBoundaryFallback";



interface ErrorBoundaryProps {

	children: ReactNode;

}



interface ErrorBoundaryState {

	hasError: boolean;

	error?: Error;

	errorInfo?: ErrorInfo;

}



class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {

	constructor(props: ErrorBoundaryProps) {

		super(props);

		this.state = { hasError: false };

	}



	static getDerivedStateFromError(error: Error): ErrorBoundaryState {

		return {

			hasError: true,

			error,

		};

	}



	componentDidCatch(error: Error, errorInfo: ErrorInfo) {

		console.error("ErrorBoundary caught an error", error, errorInfo);

		this.setState({

			error,

			errorInfo,

		});

	}



	handleRetry = (): void => {

		this.setState({ hasError: false, error: undefined, errorInfo: undefined });

	};



	render() {

		if (this.state.hasError) {

			return (

				<ErrorBoundaryFallback

					error={this.state.error}

					errorInfo={this.state.errorInfo}

					isDev={import.meta.env.DEV}

					onRetry={this.handleRetry}

					onRefresh={() => window.location.reload()}

					userAgent={navigator.userAgent}

				/>

			);

		}

		return this.props.children;

	}

}



export default ErrorBoundary;

