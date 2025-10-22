import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); 
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!supabaseUrl || !supabaseKey || !GEMINI_API_KEY) {
  Deno.serve(()=>new Response(JSON.stringify({
      error: 'Erro de Configuração: Variáveis de ambiente críticas ausentes.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    }));
}
const supabase = createClient(supabaseUrl, supabaseKey);

const jsonSchema = {
  type: "object",
  properties: {
    informacoes_gerais: {
      type: "object",
      properties: {
        disciplina: {
          type: "string"
        },
        tema: {
          type: "string"
        },
        nivel_ensino: {
          type: "string"
        },
        duracao_estimada: {
          type: "string"
        },
        recursos_didaticos: {
          type: "string"
        }
      },
      required: [
        "disciplina",
        "tema",
        "nivel_ensino",
        "duracao_estimada",
        "recursos_didaticos"
      ]
    },
    objetivo_a_ser_alcancado: {
      type: "string",
      description: "O objetivo principal que a aula busca alcançar (objetivo de aprendizagem geral)."
    },
    conteudo_abordado: {
      type: "array",
      description: "Lista de tópicos e conceitos que serão ensinados na aula.",
      items: {
        type: "string"
      }
    },
    habilidades_bncc: {
      type: "array",
      description: "Lista de códigos e descrições de Habilidades da BNCC que serão desenvolvidas pelos alunos.",
      items: {
        type: "object",
        properties: {
          codigo: {
            type: "string"
          },
          descricao: {
            type: "string"
          }
        },
        required: [
          "codigo",
          "descricao"
        ]
      }
    },
    introducao_ludica: {
      type: "string",
      description: "Uma forma criativa e engajadora de apresentar o tema (gancho)."
    },
    metodologia: {
      type: "array",
      description: "O passo a passo da atividade, detalhando as etapas, a sequência didática e a metodologia de ensino.",
      items: {
        type: "object",
        properties: {
          etapa: {
            type: "string"
          },
          descricao_detalhada: {
            type: "string"
          }
        }
      }
    },
    forma_de_avaliacao: {
      type: "object",
      properties: {
        metodo: {
          type: "string",
          description: "O tipo de avaliação (Ex: observação, rubrica, autoavaliação)."
        },
        criterios_detalhados: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: [
        "metodo",
        "criterios_detalhados"
      ]
    },
    referencias_pnld: {
      type: "array",
      description: "Sugestões de livros didáticos e materiais de referência alinhados ao PNLD (Programa Nacional do Livro Didático).",
      items: {
        type: "string"
      }
    }
  },
  required: [
    "informacoes_gerais",
    "objetivo_a_ser_alcancado",
    "conteudo_abordado",
    "habilidades_bncc",
    "introducao_ludica",
    "metodologia",
    "forma_de_avaliacao",
    "referencias_pnld"
  ]
};
serve(async (req)=>{
  try {

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
        }
      });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Método não permitido"
      }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  
    const { discipline, theme, level, duration, objective, resources, book } = await req.json();

    if (!discipline || !theme || !level || !duration) {
      return new Response(JSON.stringify({
        error: "Campos obrigatórios: 'discipline', 'theme', 'level' e 'duration'."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const { data: inputRecord, error: inputError } = await supabase.from("input").insert([
      {
        discipline,
        theme,
        level,
        duration,
        objective,
        resources,
        book
      }
    ]).select("id").single();
    if (inputError) throw inputError;
    const id_input = inputRecord.id;

    const prompt = `
            Você é um assistente pedagógico especializado e consultor de BNCC e PNLD. Sua tarefa é criar um plano de aula completo e detalhado. 
            A sua resposta DEVE ser um objeto JSON estrito, seguindo rigorosamente o esquema fornecido. 
            É crucial que o campo 'habilidades_bncc' contenha códigos e descrições reais da Base Nacional Comum Curricular e que o campo 
            'referencias_pnld' sugira materiais didáticos relevantes e alinhados ao PNLD.
            
            Dados do Plano de Aula Fornecidos pelo Usuário:
            - Disciplina: ${discipline}
            - Tema: ${theme}
            - Nível de Ensino: ${level}
            - Duração: ${duration}
            - Objetivo Principal do Usuário: ${objective ?? 'Não especificado'}
            - Recursos: ${resources ?? 'Nenhum'}
        `;

    const model = 'gemini-2.5-flash';
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: jsonSchema
        }
      })
    });
    if (!geminiResponse.ok) {

      const errText = await geminiResponse.text();
      throw new Error(`Erro na API Gemini (${geminiResponse.status}): ${errText}`);
    }
    const geminiData = await geminiResponse.json();

    let rawJsonOutput = "{}";
    if (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawJsonOutput = geminiData.candidates[0].content.parts[0].text;
    }

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(rawJsonOutput);
    } catch (e) {
      console.error("Erro no Parsing do JSON da IA:", e);
      throw new Error("A IA retornou uma resposta, mas o JSON não foi válido.");
    }

    const { data: lessonRecord, error: lessonError } = await supabase.from("lesson_plan").insert([
      {
        id_input: id_input,
        output: rawJsonOutput
      }
    ]).select().single();
    if (lessonError) throw lessonError;

    return new Response(JSON.stringify({
      message: "Plano de aula criado e salvo com sucesso!",
      input_id: id_input,
      plan_id: lessonRecord.id,
      plan: parsedOutput
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {

    console.error("Erro capturado na Edge Function:", err.message);
    return new Response(JSON.stringify({
      error: err.message || "Erro interno do servidor"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});