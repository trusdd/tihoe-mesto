# 🌟 Quiet Place

> Mental health support platform demonstrating full-stack development with social impact focus

[![HTML5](https://img.shields.io/badge/HTML5-Latest-E34C26?logo=html5&logoColor=white)]()
[![CSS3](https://img.shields.io/badge/CSS3-Latest-1572B6?logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

Comprehensive web application for mental health support featuring educational content, guided exercises, mood tracking, and crisis resources. Demonstrates user-centered design, accessibility best practices, and responsive development.

## Technologies

- **HTML5** - Semantic markup and accessibility
- **CSS3** - Modern animations and responsive design
- **JavaScript (ES6+)** - Interactive features and state management
- **LocalStorage API** - User data persistence
- **Service Workers** - Offline functionality (PWA)

## Key Features

### Content Management
- Educational articles on mental health topics
- Guided breathing exercises and techniques
- Daily affirmations system
- Crisis resources directory
- Multiple language support ready

### User Features
- Private journal with local encryption option
- Mood tracking with trend analysis
- Exercise library with instructions
- Progress tracking over time
- Completely private (no server data)

### Technical Implementation
- Service Worker for offline access
- Local storage for data persistence
- Responsive design (mobile-first)
- Accessibility WCAG 2.1 AA compliant
- Performance optimized

## Quick Start

```bash
git clone https://github.com/trusdd/tihoe-mesto.git
cd tihoe-mesto
open index.html
```

## Architecture

```
UI Layer (HTML/CSS/JS)
    |
    v
State Management (LocalStorage)
    |
    v
Data Models (Journal, exercises, moods)
    |
    v
Service Worker (Offline support)
```

## Core Components

### Journal System
- Entry creation and editing
- Mood tracking with metadata
- Tag-based organization
- Search functionality
- Trend analysis over time

### Exercise Library
- Structured exercise data
- Step-by-step instructions
- Duration tracking
- Completion logging
- User recommendations

### Mood Tracker
- Daily mood logging
- Visualization (charts/graphs)
- Trend analysis
- Weekly summaries
- Pattern recognition

## Data Privacy

All data stored locally - no server uploads
No analytics or tracking
No third-party integrations
Optional local encryption
Complete user control

## Accessibility

WCAG 2.1 AA compliant
Keyboard navigation
Screen reader support
High contrast mode
Text scaling support
Color contrast standards

## Responsive Design

- Mobile: < 480px (fully optimized)
- Tablet: 480-1024px (all features)
- Desktop: > 1024px (enhanced layout)

## Performance

- Load time: < 1.5s
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Offline-first with Service Worker

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technical Highlights

Semantic HTML structure
CSS Grid and Flexbox layouts
Advanced JavaScript patterns
Service Worker implementation
LocalStorage management
Accessibility best practices
Performance optimization
Responsive design principles

## Project Structure

```
tihoe-mesto/
index.html              
css/
  style.css
  responsive.css
  animations.css
  accessibility.css
js/
  app.js
  diary.js
  tracker.js
  exercises.js
  storage.js
  utils.js
data/
  resources.json
  articles.json
  exercises.json
  affirmations.json
offline.html
```

## Code Quality

Semantic markup
Modular JavaScript
Clean CSS organization
Error handling
Data validation
User experience focus

## Author

**trusdd** - Full-stack developer with focus on accessibility and user-centered design

## License

MIT License
