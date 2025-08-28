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
    errorElement: <ErrorPage/>,
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

//TODO: Ban album orientation
//TODO: Width slider on drawing canvas
//TODO: Fix player list scrolling on md (ugly ass when list is not scrollable)
//TODO: remove "alpha" drawing from canvas
//TODO: ColorPicker is bugged tf out(kinda fixed, but not optimal tbf)
//TODO: Drawing page submitting images incorrectly (can't replicate tho, maybe gone)
//TODO: Canvas bug where u can draw after submit if u don't release ur mouse (doesn't affect much tho)
