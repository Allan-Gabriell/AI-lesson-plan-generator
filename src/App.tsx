import "./App.css";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Button } from "./components/ui/button";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

interface PlanoAula {
  informacoes_gerais: {
    disciplina: string;
    tema: string;
    nivel_ensino: string;
    duracao_estimada: string;
    recursos_didaticos: string;
  };
  objetivo_a_ser_alcancado: string;
  conteudo_abordado: string[];
  habilidades_bncc: { codigo: string; descricao: string }[];
  introducao_ludica: string;
  metodologia: { etapa: string; descricao_detalhada: string }[];
  forma_de_avaliacao: { metodo: string; criterios_detalhados: string[] };
  referencias_pnld: string[];
}

function App() {
  const [disciplina, setDisciplina] = useState("");
  const [assunto, setAssunto] = useState("");
  const [tempo, setTempo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [recursos, setRecursos] = useState("");
  const [livro, setLivro] = useState("");
  const [nivel, setNivel] = useState("");

  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState<PlanoAula | null>(null);
  const [erro, setErro] = useState("");

  const gerarPlano = async () => {
    setErro("");
    setPlano(null);
    setLoading(true);

    if (!disciplina || !assunto || !tempo || !nivel) {
      setErro(
        "Preencha todos os campos obrigatórios: disciplina, assunto, tempo e nível."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "https://tbbdevnnzskkvmjljjut.supabase.co/functions/v1/integration-gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            discipline: disciplina,
            theme: assunto,
            level: nivel,
            duration: tempo,
            objective: objetivo,
            resources: recursos,
            book: livro,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Erro ao gerar o plano de aula");

      setPlano(data.plan as PlanoAula);
    } catch (err: any) {
      setErro(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-3xl min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <Card className="w-full max-w-md bg-neutral-900 border border-neutral-800 text-neutral-100 shadow-xl rounded-2xl">
        <CardHeader className="text-xl font-semibold text-center text-white">
          Gerador de Plano de Aula
        </CardHeader>

        <CardDescription className="text-center text-neutral-400">
          Gerador de Plano de Aula com Inteligência Artificial
        </CardDescription>

        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label className="text-neutral-300">Disciplina</Label>
              <Input
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                placeholder="Informe a disciplina"
                className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-500"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-neutral-300">Assunto</Label>
              <Input
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Informe o assunto"
                className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-500"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-neutral-300">Tempo da aula</Label>
              <Input
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                placeholder="Informe o tempo da aula"
                className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-500"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-neutral-300">Objetivo</Label>
              <Input
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Informe o objetivo da aula"
                className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-500"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-neutral-300">Recursos</Label>
              <Input
                value={recursos}
                onChange={(e) => setRecursos(e.target.value)}
                placeholder="Exemplo: apagador, projetor, quadro..."
                className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-500"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-neutral-300">Livro</Label>
              <Input
                value={livro}
                onChange={(e) => setLivro(e.target.value)}
                placeholder="Informe o livro(s) base"
                className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-500"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-neutral-300">Nível do assunto</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-neutral-100">
                  <SelectValue placeholder="Selecione o nível do assunto" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 text-neutral-100 border-neutral-700">
                  <SelectGroup>
                    <SelectLabel className="text-neutral-400">
                      Níveis
                    </SelectLabel>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {erro && (
            <p className="text-red-400 text-sm text-center mt-4">{erro}</p>
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="button"
            className="w-full text-black hover:bg-neutral-200"
            style={{ backgroundColor: "white" }}
            onClick={gerarPlano}
            disabled={loading}
          >
            {loading ? "Gerando..." : "Gerar Plano"}
          </Button>
        </CardFooter>
      </Card>

      {/* Seção do plano de aula */}
      {plano && (
        <div className="w-full max-w-3xl flex flex-col gap-4">
          <Card className="bg-neutral-800 border border-neutral-700 text-neutral-100">
            <CardHeader>Informações Gerais</CardHeader>
            <CardContent className="text-justify">
              <p>
                <strong>Disciplina:</strong>{" "}
                {plano.informacoes_gerais.disciplina}
              </p>
              <p>
                <strong>Tema:</strong> {plano.informacoes_gerais.tema}
              </p>
              <p>
                <strong>Nível:</strong> {plano.informacoes_gerais.nivel_ensino}
              </p>
              <p>
                <strong>Duração:</strong>{" "}
                {plano.informacoes_gerais.duracao_estimada}
              </p>
              <p>
                <strong>Recursos:</strong>{" "}
                {plano.informacoes_gerais.recursos_didaticos}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800 border border-neutral-700 text-neutral-100">
            <CardHeader>Objetivo a ser alcançado</CardHeader>
            <CardContent className="text-justify">
              {plano.objetivo_a_ser_alcancado}
            </CardContent>
          </Card>

          <Card className="bg-neutral-800 border border-neutral-700 text-neutral-100">
            <CardHeader>Conteúdo abordado</CardHeader>
            <CardContent className="text-justify">
              <ul className="list-disc ml-5">
                {plano.conteudo_abordado.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800 border border-neutral-700 text-neutral-100">
            <CardHeader>Habilidades BNCC</CardHeader>
            <CardContent className="text-justify">
              <ul className="list-disc ml-5">
                {plano.habilidades_bncc.map((h, i) => (
                  <li key={i}>
                    <strong>{h.codigo}:</strong> {h.descricao}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800 border border-neutral-700 text-neutral-100">
            <CardHeader>Introdução Lúdica</CardHeader>
            <CardContent className="text-justify">
              {plano.introducao_ludica}
            </CardContent>
          </Card>

          <Card className="bg-neutral-800 border border-neutral-700 text-neutral-100">
            <CardHeader>Metodologia</CardHeader>
            <CardContent className="text-justify">
              <ol className="list-decimal ml-5">
                {plano.metodologia.map((m, i) => (
                  <li key={i}>
                    <strong>{m.etapa}:</strong> {m.descricao_detalhada}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800 border border-neutral-700 text-neutral-100">
            <CardHeader>Forma de Avaliação</CardHeader>
            <CardContent className="text-justify">
              <p>
                <strong>Método:</strong> {plano.forma_de_avaliacao.metodo}
              </p>
              <ul className="list-disc ml-5">
                {plano.forma_de_avaliacao.criterios_detalhados.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800 border border-neutral-700 text-neutral-100">
            <CardHeader>Referências PNLD</CardHeader>
            <CardContent className="text-justify">
              <ul className="list-disc ml-5">
                {plano.referencias_pnld.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default App;