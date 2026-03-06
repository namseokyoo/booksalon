import React from 'react';

interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
}

class ChunkErrorBoundary extends React.Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  declare state: ChunkErrorBoundaryState;
  declare props: ChunkErrorBoundaryProps & { children?: React.ReactNode };

  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChunkErrorBoundaryState {
    const isChunkError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk');

    if (isChunkError && !sessionStorage.getItem('chunk_reload')) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
      return { hasError: false };
    }

    sessionStorage.removeItem('chunk_reload');
    return { hasError: true };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
          <p className="text-foreground text-lg mb-4">페이지를 불러오는 중 오류가 발생했습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cta text-cta-foreground rounded-lg hover:bg-cta-700 transition-colors"
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ChunkErrorBoundary;
