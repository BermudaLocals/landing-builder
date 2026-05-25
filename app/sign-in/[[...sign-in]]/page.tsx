import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LaunchPad</h1>
          <p className="text-gray-600 mt-2">Build landing pages better than landingsite.ai</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
