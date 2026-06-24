"use client";

import { useState } from "react";
import UploadAudio from "./UploadAudio";
import UploadCover from "./UploadCover";
import Metadata from "./Metadata";

export default function UploadWizard() {
  const [step, setStep] = useState(1);

  return (
    <main className="min-h-screen bg-[#050505] text-white">

      <div className="mx-auto max-w-5xl p-12">

        <h1 className="text-5xl font-black">
          Yeni Yayın
        </h1>

        <p className="mt-3 text-zinc-500">
          Şarkını birkaç adımda dağıtıma gönder.
        </p>

        <div className="mt-12 flex gap-3">

          {[1,2,3].map((i)=>(
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i<=step
                  ? "bg-violet-500"
                  : "bg-white/10"
              }`}
            />
          ))}

        </div>

        <div className="mt-14">

          {step===1 && (
            <UploadAudio next={()=>setStep(2)} />
          )}

          {step===2 && (
            <UploadCover next={()=>setStep(3)} />
          )}

          {step===3 && (
            <Metadata />
          )}

        </div>

      </div>

    </main>
  );
}