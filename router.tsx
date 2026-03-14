import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';
import AdminRoute from './components/AdminRoute';

const ForumList = React.lazy(() => import('./components/ForumList'));
const ForumView = React.lazy(() => import('./components/ForumView'));
const AllBestPostsPage = React.lazy(() => import('./components/AllBestPostsPage'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const ActivityFeed = React.lazy(() => import('./components/ActivityFeed'));
const MessagingPage = React.lazy(() => import('./components/MessagingPage'));
const NotificationComponent = React.lazy(() => import('./components/NotificationComponent'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const PrivacyPage = React.lazy(() => import('./components/PrivacyPage'));
const TermsPage = React.lazy(() => import('./components/TermsPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ChunkErrorBoundary><RootLayout /></ChunkErrorBoundary>,
    children: [
      { index: true, element: <ForumList /> },
      { path: 'forum/:isbn', element: <ForumView /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/:userId', element: <ProfilePage /> },
      { path: 'activity', element: <ActivityFeed /> },
      { path: 'best-posts', element: <AllBestPostsPage /> },
      { path: 'messages', element: <MessagingPage /> },
      { path: 'messages/:userId', element: <MessagingPage /> },
      { path: 'notifications', element: <NotificationComponent /> },
      { path: 'admin', element: <AdminRoute><AdminDashboard /></AdminRoute> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
    ],
  },
]);
