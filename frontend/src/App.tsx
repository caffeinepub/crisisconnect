import React from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, redirect } from '@tanstack/react-router';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HospitalFinderPage from './pages/HospitalFinderPage';
import BloodDonorPage from './pages/BloodDonorPage';
import VolunteerPage from './pages/VolunteerPage';
import ResourceMapPage from './pages/ResourceMapPage';
import EmergencyContactsPage from './pages/EmergencyContactsPage';

// Root route with layout
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route (no layout wrapper)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Layout route for authenticated pages
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: AppLayout,
});

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const hospitalsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hospitals',
  component: HospitalFinderPage,
});

const bloodDonorsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/blood-donors',
  component: BloodDonorPage,
});

const volunteersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/volunteers',
  component: VolunteerPage,
});

const mapRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/map',
  component: ResourceMapPage,
});

const emergencyContactsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/emergency-contacts',
  component: EmergencyContactsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    hospitalsRoute,
    bloodDonorsRoute,
    volunteersRoute,
    mapRoute,
    emergencyContactsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
