import { createBrowserRouter, RouterProvider, useNavigationType } from 'react-router';
import { useCookies } from 'react-cookie';
import { WelcomePage } from './pages/WelcomePage';
import { MainLayout } from './components/MainLayout';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { RoomPage } from './pages/RoomPage';
import { CreatePlayerPage } from './pages/CreatePlayerPage';
import { useEffect } from 'react';
import { leave } from './misc/MiscFunctions';

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
  const navigationType = useNavigationType();

  async function onUnload()
  {
    await leave(cookie,removeCookie);
  }

  useEffect(() => {
    if (navigationType === "POP") {
      onUnload();
    }
  }, [navigationType]);

  useEffect(()=>{
    window.addEventListener("beforeunload",onUnload)
    return ()=> {
      window.removeEventListener("beforeunload",onUnload);
    }
  },[])

  return (
      <RouterProvider router={router}/>
  )
}

export default App;

//TODO: dynamic feedback on errors
//TODO: leave and back buttons
//TODO: move from hardcoding margins and inline css
//TODO: is admin indicator in room page
//TODO: mark player's nickname
//TODO: do not keep history of navigation (back button will move to whatever was before openning the app)
//TODO: context for keeping track of ws connections