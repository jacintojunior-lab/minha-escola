export function alunoAtivo(a){
  return (a.situacao || "Ativo") === "Ativo"
}

export function turmaValida(a, turmas){
  const nomes = turmas.map(t => t.nome)
  return nomes.includes(a.turma)
}

export function filtrarAtivosComTurma(alunos, turmas){
  return alunos.filter(a =>
    turmaValida(a, turmas) && alunoAtivo(a)
  )
}