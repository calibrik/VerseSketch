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

//TODO: website design on other devices is beyond fucked
//TODO: session cookies are not in sync with tabs (it's not really a problem tbf)
//TODO: random error with errorDisplayProvider (probably hot reload issue only)
//TODO: Random WS handshake issue on devices (it kinda works now, apparently it was related to cookies, but not sure)
//TODO: WS should be terminated even if it not in connected state
//TODO: Cookies had to go because they don't work properly on IIS with settings for some reason, session storage is used instead, but it less safe