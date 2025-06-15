import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './TableRenderer';
import { ThemeProvider } from './components/ThemeProvider';

// Error Boundary Component
class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean; error?: Error }
> {
	constructor(props: any) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: any) {
		console.error('Error caught by boundary:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: '20px', color: 'white', background: '#1a1a1a' }}>
					<h2>Something went wrong.</h2>
					<details style={{ whiteSpace: 'pre-wrap' }}>
						{this.state.error?.toString()}
					</details>
					<button onClick={() => window.location.reload()}>Reload</button>
				</div>
			);
		}

		return this.props.children;
	}
}

// Render the app
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
	<ErrorBoundary>
		<ThemeProvider>
			<App />
		</ThemeProvider>
	</ErrorBoundary>
);
