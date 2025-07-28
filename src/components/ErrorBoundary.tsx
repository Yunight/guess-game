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
	error?: Error;
	errorInfo?: ErrorInfo;
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
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error,
		};
	}

	/**
	 * Log error details.
	 * @param error The error that was caught.
	 * @param errorInfo Additional error information.
	 */
	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error", error, errorInfo);
		this.setState({
			error,
			errorInfo,
		});
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
	};

	render() {
		if (this.state.hasError) {
			const isMobile =
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent,
				);
			const isNetworkError =
				this.state.error?.message.includes("fetch") ||
				this.state.error?.message.includes("network") ||
				this.state.error?.message.includes("load");

			// Render fallback UI in case of error
			return (
				<div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4 flex items-center justify-center">
					<div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto text-center">
						<div className="text-6xl mb-4">⚠️</div>
						<h2 className="text-xl font-bold mb-4 text-gray-800">
							{isMobile ? "Mobile Loading Error" : "Something went wrong"}
						</h2>

						{isMobile && isNetworkError ? (
							<div className="space-y-3 text-sm text-gray-600">
								<p>The app failed to load properly on your device.</p>
								<p className="font-semibold">Quick fixes to try:</p>
								<ul className="text-left space-y-1">
									<li>• Check your internet connection</li>
									<li>• Close and reopen the app</li>
									<li>• Clear your browser cache</li>
									<li>• Try using Safari instead of other browsers</li>
								</ul>
							</div>
						) : (
							<p className="text-gray-600 mb-4">
								An unexpected error occurred. Please try refreshing the page.
							</p>
						)}

						<div className="flex flex-col gap-2 mt-6">
							<button
								type="button"
								onClick={this.handleRetry}
								className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
							>
								Try Again
							</button>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
							>
								Refresh Page
							</button>
						</div>

						{process.env.NODE_ENV === "development" && this.state.error && (
							<details className="mt-4 text-left">
								<summary className="cursor-pointer text-sm text-gray-500">
									Technical Details (Development)
								</summary>
								<pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
									{this.state.error.toString()}
									{this.state.errorInfo?.componentStack}
								</pre>
							</details>
						)}
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

export default ErrorBoundary;
