# 🎵 Professional Audio Metadata Editor

A sophisticated Electron-based application for editing BWF (Broadcast Wave Format) and iXML metadata in professional audio workflows. Built with React, TypeScript, and modern web technologies with a beautiful "Liquid Glass" design.

## ✨ Features

### 🎯 Core Functionality

- **Multi-file Table Interface**: Edit metadata for hundreds of files simultaneously
- **BWF & iXML Support**: Full support for broadcast wave format and iXML metadata standards
- **Real-time Editing**: Inline cell editing with immediate visual feedback
- **Search & Filter**: Advanced search across any metadata field
- **Batch Operations**: Select multiple files and edit them simultaneously
- **Auto-save**: Background agents automatically save changes
- **Undo/Redo System**: Full command history with 50-level undo support

### 🎨 Professional UI Design

- **Liquid Glass Aesthetic**: Inspired by Apple's design language
- **Dark Theme**: Optimized for professional audio environments
- **Responsive Layout**: Adapts to different screen sizes
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Loading States**: Professional progress indicators
- **Error Handling**: Graceful error recovery with user feedback

### 🔧 Technical Features

- **File Watching**: Real-time monitoring of external file changes
- **Background Agents**: Automated file monitoring and saving
- **Progress Tracking**: Visual progress for long operations
- **Filename Pattern Recognition**: Automatic metadata extraction from filenames
- **Test Data Generation**: Built-in test file creation for development

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or later)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd metadata-electron

# Install dependencies
npm install

# Start development server
npm start
```

### Creating Test Files

1. Launch the application
2. Click the "🧪 Create Test Files" button
3. The app will generate sample WAV files with metadata
4. Start editing immediately!

## 🎛️ Usage Guide

### Loading Files

1. **Select Directory**: Click "📁 Select Directory" to choose a folder containing WAV files
2. **Auto-scan**: The app automatically scans for .wav files and loads their metadata
3. **Progress Tracking**: Watch the loading progress in the status bar

### Editing Metadata

- **Single Cell**: Click any cell to edit inline
- **Multi-select**: Ctrl+Click or Shift+Click to select multiple rows
- **Batch Edit**: Use "✏️ Batch Edit" to apply values to selected rows
- **Search**: Use the search box to filter files by any field

### Keyboard Shortcuts

- `Ctrl+S` - Save all changes
- `Ctrl+Z` - Undo last change
- `Ctrl+Shift+Z` - Redo change
- `Ctrl+A` - Select all files
- `Ctrl+F` - Focus search box
- `?` - Show/hide keyboard shortcuts
- `Esc` - Clear selections or close dialogs

### Metadata Fields

- **📄 Filename**: Display-only file name
- **🎬 Show**: Project or show name
- **🎭 Scene**: Scene identifier
- **🎯 Take**: Take number
- **📂 Category**: Audio category (DIALOG, SFX, MUSIC)
- **📋 Subcategory**: Audio subcategory
- **🎪 Slate**: Slate information
- **📝 Note**: General notes
- **⏱️ Duration**: File duration (read-only)
- **💾 Size**: File size (read-only)

## 🏗️ Architecture

### Technology Stack

- **Electron**: Cross-platform desktop app framework
- **React**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Emotion**: Styled components with CSS-in-JS
- **Zustand**: Lightweight state management
- **Webpack**: Module bundling and hot reload

### Key Components

- **Main Process** (`src/main/`): Electron main process, file operations, IPC handlers
- **Renderer Process** (`src/renderer/`): React UI, state management, user interactions
- **Services** (`src/main/services/`): Business logic, metadata processing, file handling
- **Background Agents** (`src/main/services/agents/`): Auto-save, file watching, background tasks

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ELECTRON APP                            │
├─────────────────────┬─────────────────┬─────────────────────────┤
│   MAIN PROCESS      │   PRELOAD       │    RENDERER PROCESS     │
│                     │                 │                         │
│ • MetadataService   │ • IPC Bridge    │ • TableRenderer         │
│ • FileService       │ • Type Safety   │ • Store (Zustand)       │
│ • BackgroundAgents  │ • API Exposure  │ • Styled Components     │
│ • TestDataService   │                 │ • Event Handlers        │
└─────────────────────┴─────────────────┴─────────────────────────┘
```

## 🔧 Development

### File Structure

```
src/
├── main/                 # Electron main process
│   ├── index.ts         # Main entry point
│   └── services/        # Business logic services
│       ├── MetadataService.ts    # BWF/iXML metadata handling
│       ├── FileService.ts        # File operations
│       ├── TestDataService.ts    # Test data generation
│       ├── BackgroundAgentManager.ts  # Agent coordination
│       └── agents/      # Background agents
│           ├── AutoSaveAgent.ts      # Automatic saving
│           └── FileWatcherAgent.ts   # File monitoring
├── renderer/            # React UI application
│   ├── index.tsx        # Entry point
│   ├── TableRenderer.tsx # Main table interface
│   ├── store.ts         # Zustand state management
│   └── fonts/           # Typography assets
├── preload.ts           # IPC bridge (security)
└── types.ts             # Shared TypeScript interfaces
```

### Building & Distribution

```bash
# Package for current platform
npm run package

# Create distributables
npm run make

# Clean build
npm run clean
```

### Adding New Metadata Fields

1. Update `BWFMetadata` or `IXMLMetadata` interfaces in `src/types.ts`
2. Add field extraction in `MetadataService.ts`
3. Add table column in `TableRenderer.tsx`
4. Update file processing in the store

## 🎵 Audio Metadata Standards

### BWF (Broadcast Wave Format)

Standard metadata fields embedded in WAV files:

- **Description**: Content description
- **Originator**: Recording device/software
- **Originator Reference**: Unique file identifier
- **Origination Date/Time**: Recording timestamp
- **Time Reference**: Sample-accurate timing
- **Coding History**: Processing chain history

### iXML Metadata

XML-based metadata for production workflows:

- **PROJECT**: Production or project name
- **SCENE**: Scene identifier
- **TAKE**: Take number
- **CATEGORY**: Audio type classification
- **NOTE**: Production notes

## 🚀 Performance Features

### Optimizations

- **Lazy Loading**: Metadata loaded on demand
- **File Watching**: Efficient real-time monitoring
- **Batch Operations**: Optimized multi-file processing
- **Memory Management**: Automatic cleanup of large datasets
- **Progressive Loading**: Show basic info first, details later

### Scalability

- **Large Collections**: Handles hundreds of files efficiently
- **Background Processing**: Non-blocking operations
- **Incremental Updates**: Only save changed files
- **Caching System**: Smart metadata caching

## 🔒 Security & Reliability

### Data Safety

- **Backup Creation**: Automatic `.backup` files before writing
- **Atomic Writes**: Fail-safe file operations
- **Validation**: Input validation and error recovery
- **Rollback Support**: Restore from backup on failure

### Error Handling

- **Graceful Degradation**: Continue working with partial failures
- **User Feedback**: Clear error messages and recovery options
- **Logging**: Comprehensive error tracking
- **Auto-recovery**: Automatic retry mechanisms

## 🎯 Use Cases

### Professional Audio

- **Post-production**: Film, TV, and podcast workflows
- **Broadcasting**: Radio and TV station asset management
- **Sound Libraries**: Organizing large audio collections
- **Production**: Live recording metadata management

### Workflow Integration

- **DAW Compatible**: Works with Pro Tools, Logic, Cubase
- **Archive Systems**: Prepare files for long-term storage
- **Delivery Prep**: Ensure metadata compliance for delivery
- **Asset Management**: Organize production audio assets

## 🛠️ Troubleshooting

### Common Issues

1. **Files not loading**: Check directory permissions and file formats
2. **Metadata not saving**: Verify file write permissions
3. **Slow performance**: Reduce file count or restart background agents
4. **Search not working**: Check search field selection and syntax

### Debug Mode

```bash
# Start with debug logging
DEBUG=* npm start

# Check console for detailed logs
# Open DevTools: View → Toggle Developer Tools
```

## 📝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow TypeScript strict mode
4. Add tests for new functionality
5. Ensure UI follows Liquid Glass design language
6. Submit a pull request

### Code Style

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Styling**: Emotion styled components
- **Naming**: PascalCase for components, camelCase for functions

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Electron Team**: Cross-platform desktop framework
- **React Team**: Modern UI development
- **wavefile**: BWF/WAV metadata handling
- **fast-xml-parser**: iXML processing
- **Inter Font**: Professional typography

---

**Made with ❤️ for professional audio workflows**

For support, questions, or feature requests, please open an issue on GitHub.
