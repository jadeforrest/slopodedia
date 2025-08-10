# 🌀 Slopopedia

A recursive wiki that builds itself, one session at a time.

## Concept

Slopopedia is an experimental wiki where each session involves one of three activities:

1. **Create** a new page with interesting content
2. **Improve** an existing page (editing content, adding links)  
3. **Enhance** the site itself (features, design, operations)

## Current Status

**Session #1 Complete** - Basic site foundation established:
- ✅ HTML structure with navigation
- ✅ CSS styling with responsive design
- ✅ JavaScript functionality for page management
- ✅ Local storage for persistence
- ✅ Page creation and linking system

## How to Use

1. Open `index.html` in a web browser
2. Navigate between sections using the top navigation
3. Use browser console dev helpers:
   - `slopopedia.dev_createSamplePage()` - Create a sample page
   - `slopopedia.dev_reset()` - Reset all data
   - `slopopedia.pages` - View all pages

## Architecture

- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Storage**: Browser localStorage for persistence
- **Structure**: Single-page application with section switching
- **Data**: JSON objects for pages with metadata and linking

## Next Session Ideas

- Add a proper page editor interface
- Implement markdown support for content
- Create import/export functionality
- Add search functionality
- Implement page categories or tags
- Add page history/versioning
- Create interesting first content pages

## Session Instructions for Claude

**Working Directory**: `/Users/jade/Documents/Activities/Code/slopopedia`

**Session Workflow**:
1. Always start by reading this README.md to understand current state
2. Choose ONE of the three activities:
   - **Activity 1**: Create new page with interesting content
   - **Activity 2**: Improve existing page (content/links)
   - **Activity 3**: Enhance site (features/design/operations)
3. Use TodoWrite tool to plan and track progress
4. Update this README.md session status when complete

**File Structure**:
- `index.html` - Main wiki interface
- `style.css` - All styling and responsive design
- `script.js` - Wiki functionality and page management
- `README.md` - This file (operational instructions)
- `pages/` - Directory containing content pages as JSON files

**Key JavaScript API** (accessible via browser console):
- `slopopedia.pages` - Array of all pages
- `slopopedia.createPage(title, content, excerpt)` - Add new page
- `slopopedia.updatePage(pageId, updates)` - Modify existing page
- `slopopedia.linkPages(fromPageId, toPageId)` - Connect pages
- `slopopedia.searchPages(query)` - Find content
- `slopopedia.dev_createSamplePage()` - Generate test content
- `slopopedia.dev_reset()` - Clear all data

**Data Storage**: 
- Pages stored in browser localStorage as JSON
- Session count auto-increments each load
- Page structure: `{id, title, content, excerpt, created, updated, links[]}`

**Testing the Site**:
- Open `index.html` in browser
- Check all navigation works (Home/Pages/Random/About)
- Test page creation via console
- Verify localStorage persistence

## Current Status

**Session #1 Complete** - Basic site foundation established:
- ✅ HTML structure with navigation
- ✅ CSS styling with responsive design
- ✅ JavaScript functionality for page management
- ✅ Local storage for persistence
- ✅ Page creation and linking system

**Session #2 Complete** - First content and file-based pages:
- ✅ Created "The Recursive Loop" page about self-referential systems
- ✅ Created "Emergence" page about complex systems from simple components
- ✅ Added cross-links between pages demonstrating wiki connectivity
- ✅ Implemented file-based page loading system (JSON files in /pages/)

## Rules Evolution

The rules can be rewritten each session as part of activity #3. Current rules:
- Choose one activity per session
- Build incrementally on previous work
- Maintain the recursive/self-improving nature
- Focus on making the wiki more interesting and useful