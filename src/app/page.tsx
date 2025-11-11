

import { currentUser } from '@clerk/nextjs/server'
import {SignInButton, SignUpButton} from "@clerk/nextjs";


export default async function Home() {
  const user = await currentUser()
  console.log(user)
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-center text-4xl font-bold">Bienvenido a Sinergia</h1>
        <div className="flex flex-col items-center gap-4 mt-8">
          <SignInButton mode="modal">
            <button className="bg-[#6d8f20] text-white rounded-md font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
              Inicia sesión
            </button>
          </SignInButton>
          {/* <SignUpButton mode="modal">
            <button className="bg-[#6c47ff] text-white rounded-md font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
              Crear cuenta
            </button>
          </SignUpButton> */}
        </div>
        
      </main>
    </div>
  );
}
