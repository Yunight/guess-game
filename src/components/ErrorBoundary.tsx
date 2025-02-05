import React, { Component, type ReactNode, type ErrorInfo } from "react";

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
	children: ReactNode;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
	hasError: boolean;
}

/**
 * ErrorBoundary component for catching errors in the component tree.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	/**
	 * Update state when an error is thrown.
	 * @param error The error that was thrown.
	 */
	static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
		void _error;
		return { hasError: true };
	}

	/**
	 * Log error details.
	 * @param error The error that was caught.
	 * @param errorInfo Additional error information.
	 */
	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			// Render fallback UI in case of error
			return <div>Something went wrong.</div>;
		}
		return this.props.children;
	}
}

export default ErrorBoundary;
