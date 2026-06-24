export default function AIReviewCard() {
  return (
    <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-500/10 to-transparent p-6">

      <div className="mb-6">

        <p className="text-violet-400 text-sm">
          Radarune AI Review
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Son Analiz
        </h2>

      </div>

      <div className="space-y-4">

        <Item title="Dosya Sağlam" ok />

        <Item title="44.1kHz" ok />

        <Item title="24 Bit" ok />

        <Item title="Kapak 3000×3000" ok />

        <Item title="Metadata Tam" ok />

        <Item title="Sample Riski" warning />

      </div>

      <div className="mt-8">

        <div className="mb-2 flex justify-between">

          <span>Risk Skoru</span>

          <span className="text-yellow-400">
            12%
          </span>

        </div>

        <div className="h-3 rounded-full bg-white/10">

          <div className="h-full w-[12%] rounded-full bg-yellow-400"/>

        </div>

      </div>

    </div>
  );
}

function Item({
  title,
  ok,
  warning,
}:{
  title:string
  ok?:boolean
  warning?:boolean
}){

  return(

    <div className="flex items-center justify-between">

      <span>{title}</span>

      {ok && <span className="text-green-400">✓</span>}

      {warning && <span className="text-yellow-400">!</span>}

    </div>

  )

}