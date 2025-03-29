import { createBrowserRouter, RouterProvider } from 'react-router';
import { WelcomePage } from './pages/WelcomePage';
import { MainLayout } from './components/MainLayout';
import { CreateRoomPage } from './pages/CreateRoomPage';

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
        path: '/create-room',
        Component: CreateRoomPage
      }
    ]
  }
]);


function App() {
  return (
    <RouterProvider router={router}/>
  )
}

export default App;

