import { createBrowserRouter, RouterProvider } from 'react-router';
import { useCookies } from 'react-cookie';
import { WelcomePage } from './pages/WelcomePage';
import { MainLayout } from './components/MainLayout';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { RoomPage } from './pages/RoomPage';
import { CreatePlayerPage } from './pages/CreatePlayerPage';
import { useEffect, useRef } from 'react';
import { leave } from './misc/MiscFunctions';
import { useSignalRConnection } from './components/SignalRProvider';

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

  const [cookie,,removeCookie]=useCookies(['player']);
  const connection=useSignalRConnection();
  const cookieRef=useRef<string>(undefined)

  async function onUnload()
  {
    await leave(cookieRef.current,removeCookie,connection);
  }

  useEffect(()=>{
    cookieRef.current=cookie.player;//this makes no sense, but it works lol. Could be inconsistent tho, cuz it's just timings
  },[cookie])

  useEffect(()=>{
    window.addEventListener("beforeunload",onUnload)
    return ()=> {
      window.removeEventListener("beforeunload",onUnload);
    }
  },[])

  return (
      <RouterProvider router={router} key={location.pathname}/>
  )
}

export default App;

//TODO: leave and back buttons
//TODO: move from hardcoding margins and inline css
//TODO: is admin indicator in room page
//TODO: mark player's nickname
//TODO: session cookies are not in sync with tabs
//TODO: random error with errorDisplayProvider (probably hot reload issue only)
//TODO: Regex doesn't allow space bars