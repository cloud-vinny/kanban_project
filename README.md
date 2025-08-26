# 🎯 Kanban Board - Modern Task Management

A beautiful, modern Kanban board built with **Next.js 14**, **TypeScript**, and **Supabase** for seamless task organization and project management.

![Kanban Board](https://img.shields.io/badge/Next.js-14.0.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2.38.4-green?style=for-the-badge&logo=supabase)


## 🌐 Live Demo

**🎉 Live Demo: [https://kanban-project-cloud-vinny.vercel.app](https://kanban-project-cloud-vinny.vercel.app)**

*The application is now fully deployed and working on Vercel!*

## ✨ Features

### 🎨 **Modern UI/UX**
- **Gradient backgrounds** with glass-morphism effects
- **Responsive design** that works on all devices
- **Smooth animations** and hover effects
- **Clean, intuitive interface** with no clutter

### 🚀 **Full CRUD Functionality**
- **Create cards** with titles and descriptions
- **Edit cards** by clicking directly on text
- **Delete cards** with clean trash can emoji 🗑️
- **Real-time updates** with Supabase integration

### 🎯 **Kanban Workflow**
- **Drag & Drop** cards between columns
- **Multiple columns** (TODO, DOING, DONE)
- **Position management** for card ordering
- **Visual feedback** during drag operations

### 🔧 **Developer Experience**
- **TypeScript** for type safety
- **Modern React patterns** with hooks
- **Clean code architecture** and separation of concerns
- **Error handling** and loading states

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Custom CSS with modern design principles
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (ready for future use)
- **Deployment**: Ready for Vercel, Netlify, or any hosting platform

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cloud-vinny/kanban_project.git
   cd kanban_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase Database**
   Run the following SQL in your Supabase SQL editor:
   ```sql
   -- Enable required extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";

   -- Create tables
   CREATE TABLE boards (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE columns (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     position INTEGER NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE cards (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
     column_id UUID REFERENCES columns(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     description TEXT,
     position INTEGER NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Enable Row Level Security (optional)
   ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
   ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
   ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Creating Boards
- Visit the home page
- Enter a board title
- Click "Create Board"

### Managing Cards
- **Add cards**: Click "+ Add a card" in any column
- **Edit cards**: Click directly on card title or description
- **Delete cards**: Click the trash can emoji 🗑️
- **Move cards**: Drag and drop between columns

### Board Navigation
- **View boards**: Home page shows all your boards
- **Access board**: Click on any board to open it
- **Responsive design**: Works perfectly on mobile and desktop

## 🎨 Customization

### Styling
The project uses custom CSS with modern design principles. Key styling features:
- **CSS Variables** for consistent theming
- **Flexbox and Grid** for responsive layouts
- **Glass-morphism effects** with backdrop blur
- **Smooth transitions** and hover animations

### Adding Features
The modular architecture makes it easy to add new features:
- **New card types** with additional fields
- **Column templates** for different workflows
- **User authentication** and permissions
- **Real-time collaboration** with Supabase subscriptions

## 🚀 Deployment

### 🌐 Deployment Status

**✅ Successfully Deployed on Vercel!**

The application is now live at: **[https://kanban-project-cloud-vinny.vercel.app](https://kanban-project-cloud-vinny.vercel.app)**

### Vercel Deployment (Completed)
✅ **Code pushed** to GitHub  
✅ **Repository imported** to Vercel  
✅ **Environment variables** configured  
✅ **Automatic deployment** completed  
✅ **Live demo** available and working  

*The deployment process was smooth and the application is fully functional with all features working correctly.*

### Other Free Options
- **Netlify**: Works with build command `npm run build`
- **Railway**: Deploy with Docker support
- **Render**: Free tier available for web services

### Self-hosted
- **Build**: `npm run build`
- **Serve**: Use any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Next.js team** for the amazing framework
- **Supabase team** for the powerful backend
- **React community** for the excellent ecosystem

## 📞 Support

If you have any questions or need help:
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Reach out for direct support

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**

*Ready to organize your tasks and boost productivity! 🚀*
