import { LoaderArgs } from '@remix-run/node';
import chave from '~/assets/img/chave.jpg';
import LoginWrapper from '~/components/wrappers/LoginWrapper';

export async function loader({ request }: LoaderArgs) {
  return {};
}

export default function Entrar() {
  return (
    <LoginWrapper>
      <div className='flex flex-col overflow-y-auto md:flex-row'>
        <div className='h-32 md:h-auto md:w-1/2'>
          <img
            aria-hidden='true'
            className='object-cover w-full h-full dark:hidden'
            src={chave}
            alt='Office'
          />
        </div>
        <div className='flex items-center justify-center p-6 sm:p-12 md:w-1/2'>
          <div className='w-full'>
            <h1 className='mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200'>
              Bem-vindo ao ChaveCloud
            </h1>
            <label className='block text-sm'>
              <span className='text-gray-700 dark:text-gray-400'>Email</span>
              <input
                className='block w-full mt-1 text-sm dark:border-gray-600 dark:bg-gray-700 focus:border-purple-400 focus:outline-none focus:shadow-outline-purple dark:text-gray-300 dark:focus:shadow-outline-gray form-input'
                placeholder='Digite seu e-mail aqui'
              />
            </label>
            <label className='block mt-4 text-sm'>
              <span className='text-gray-700 dark:text-gray-400'>Password</span>
              <input
                className='block w-full mt-1 text-sm dark:border-gray-600 dark:bg-gray-700 focus:border-purple-400 focus:outline-none focus:shadow-outline-purple dark:text-gray-300 dark:focus:shadow-outline-gray form-input'
                placeholder='Digite sua senha aqui'
                type='password'
              />
            </label>

            <a
              className='block w-full px-4 py-2 mt-4 text-sm font-medium leading-5 text-center text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple'
              href='../index.html'
            >
              Entrar
            </a>

            <hr className='my-8' />

            <p className='mt-4'>
              <a
                className='text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline'
                href='./forgot-password.html'
              >
                Esqueceu sua senha?
              </a>
            </p>
            <p className='mt-1'>
              <a
                className='text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline'
                href='./create-account.html'
              >
                Criar uma conta
              </a>
            </p>
          </div>
        </div>
      </div>
    </LoginWrapper>
  );
}
