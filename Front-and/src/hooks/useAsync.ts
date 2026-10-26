import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

interface Estado<T> {
  dados: T | undefined;
  erro: Error | null;
  carregando: boolean;
}

/**
 * Executa uma função assíncrona ao montar o componente e sempre que as dependências mudarem.
 * `recarregar(true)` atualiza em segundo plano: mantém os dados na tela enquanto busca.
 */
export function useAsync<T>(funcao: () => Promise<T>, dependencias: DependencyList) {
  const [estado, setEstado] = useState<Estado<T>>({ dados: undefined, erro: null, carregando: true });
  const ultimaChamada = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(async (emSegundoPlano = false) => {
    const chamada = ++ultimaChamada.current;
    if (!emSegundoPlano) setEstado({ dados: undefined, erro: null, carregando: true });
    try {
      const dados = await funcao();
      if (chamada === ultimaChamada.current) setEstado({ dados, erro: null, carregando: false });
    } catch (e) {
      if (chamada !== ultimaChamada.current) return;
      const erro = e instanceof Error ? e : new Error(String(e));
      // Numa atualização em segundo plano que falha, os dados anteriores continuam na tela.
      setEstado((atual) =>
        emSegundoPlano && atual.dados !== undefined ? atual : { dados: undefined, erro, carregando: false },
      );
    }
  }, dependencias);

  useEffect(() => {
    void executar();
  }, [executar]);

  return { ...estado, recarregar: executar };
}
