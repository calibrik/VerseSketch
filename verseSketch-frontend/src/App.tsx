import { createBrowserRouter, RouterProvider } from 'react-router';
import { WelcomePage } from './pages/WelcomePage';
import { MainLayout } from './components/MainLayout';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { RoomPage } from './pages/RoomPage';
import { CreatePlayerPage } from './pages/CreatePlayerPage';

const router=createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      {
        index:true,
        Component: WelcomePage,
      },
      {
        path: '/join-room',
        Component: JoinRoomPage
      },
      {
        path: '/create-room',
        Component: CreateRoomPage
      },
      {
        path: '/room',
        Component: RoomPage
      },
      {
        path: '/join-room/:roomName',
        Component: CreatePlayerPage
      },
    ]
  }
]);


function App() {
  return (
    <RouterProvider router={router}/>
  )
}

export default App;

