import { createBrowserRouter, RouterProvider } from 'react-router';
import { WelcomePage } from './pages/WelcomePage';
import { MainLayout } from './components/MainLayout';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { RoomPage } from './pages/RoomPage';
import { CreatePlayerPage } from './pages/CreatePlayerPage';
import { useEffect } from 'react';
import { leave } from './misc/MiscFunctions';
import { useSignalRConnectionContext } from './components/SignalRProvider';
import { ErrorPage } from './pages/ErrorPage';
import { InsertLyricsPage } from './pages/InsertLyricsPage';
import { DrawingPage } from './pages/DrawingPage';

const router=createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    // errorElement: <ErrorPage/>,
    children: [
      {
        index:true,
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
        path:'/draw',
        Component:DrawingPage
      }
    ]
  }
]);



function App() {

  const connection=useSignalRConnectionContext();

  async function onUnload()
  {
    await leave(connection);
  }

  function onPageShow(e:any)
  {
    if (e.persisted) 
      window.location.reload();
  }

  useEffect(()=>{
    window.addEventListener("beforeunload",onUnload)
    window.addEventListener("pageshow",onPageShow);
    console.log(location.pathname);
    return ()=> {
      window.removeEventListener("beforeunload",onUnload);
      window.removeEventListener("pageshow",onPageShow);
    }
  },[])

  return (
      <RouterProvider router={router}/>
  )
}

export default App;

//TODO: random error with errorDisplayProvider (probably hot reload issue only)
//TODO: Random WS handshake issue on devices (if connecting by wifi on the phone, still random tho)
//TODO: onInvite clipboard bug when accessing by local (api doesn't work on http)
//TODO: Think about make responsive stuff in react itself
