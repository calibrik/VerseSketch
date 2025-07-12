import { createBrowserRouter, RouterProvider } from 'react-router';
import { WelcomePage } from './pages/WelcomePage';
import { MainLayout } from './components/MainLayout';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { RoomPage } from './pages/RoomPage';
import { CreatePlayerPage } from './pages/CreatePlayerPage';
import { ErrorPage } from './pages/ErrorPage';
import { InsertLyricsPage } from './pages/InsertLyricsPage';
import { DrawingPage } from './pages/DrawingPage';
import { ShowcasePage } from './pages/ShowcasePage';

const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    // errorElement: <ErrorPage/>,
    children: [
      {
        index: true,
        Component: WelcomePage,
      },
      {
        path: '/join-room',
        Component: JoinRoomPage,
      },
      {
        path: '/create-room',
        Component: CreateRoomPage
      },
      {
        path: '/room/:roomTitle',
        Component: RoomPage
      },
      {
        path: '/join-room/:roomTitle',
        Component: CreatePlayerPage
      },
      {
        path: '/join-room/by-link/:joinToken',
        Component: CreatePlayerPage
      },
      {
        path: '/insert-lyrics',
        Component: InsertLyricsPage
      },
      {
        path: '/draw',
        Component: DrawingPage
      },
      {
        path: '/showcase',
        Component: ShowcasePage
      }
    ]
  }
]);



function App() {

  return (
    <RouterProvider router={router} />
  )
}

export default App;

//TODO: random error with errorDisplayProvider (probably hot reload issue only)
//TODO: Random WS handshake issue on devices (if connecting by wifi on the phone, still random tho)
//TODO: onInvite clipboard bug when accessing by local (api doesn't work on http)
//TODO: Fix some design using responsive stuff in react itself (create page)
//TODO: Ban album orientation
//TODO: Width slider on drawing canvas
//TODO: Tinker with showcase canvas size
//TODO: Fix player list scrolling on md (ugly ass when list is not scrollable)
//TODO: Player complete counter won't update after reconnecting
//TODO: Back/Forward buttons for drawing
//TODO: remove "alpha" drawing from canvas
