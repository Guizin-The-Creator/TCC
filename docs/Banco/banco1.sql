-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `mydb` ;

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
-- -----------------------------------------------------
-- Schema sistemagestao
-- -----------------------------------------------------
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`segmentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`segmentos` (
  `idSegmento` INT NOT NULL,
  `nomeSegmento` VARCHAR(45) NULL,
  PRIMARY KEY (`idSegmento`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`subsegmentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`subsegmentos` (
  `idSubsegmento` INT NOT NULL,
  `nomeSubsegmento` VARCHAR(45) NULL,
  `idSegmento` INT NOT NULL,
  PRIMARY KEY (`idSubsegmento`),
  INDEX `fk_subsegmento_segmento1_idx` (`idSegmento` ASC),
  CONSTRAINT `fk_subsegmento_segmento1`
    FOREIGN KEY (`idSegmento`)
    REFERENCES `mydb`.`segmentos` (`idSegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`indices`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`indices` (
  `idIndice` INT NOT NULL,
  `nomeIndice` VARCHAR(45) NULL,
  `taxaIndice` DECIMAL(10,2) NULL,
  `idSubsegmento` INT NOT NULL,
  `anoIndice` VARCHAR(45) NULL,
  PRIMARY KEY (`idIndice`),
  INDEX `fk_rentabilidade_subsegmento1_idx` (`idSubsegmento` ASC),
  UNIQUE INDEX `ano_UNIQUE` (`anoIndice` ASC),
  CONSTRAINT `fk_rentabilidade_subsegmento1`
    FOREIGN KEY (`idSubsegmento`)
    REFERENCES `mydb`.`subsegmentos` (`idSubsegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`categorias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`categorias` (
  `idCategoria` INT NOT NULL,
  `nomeCategoria` VARCHAR(45) NULL,
  PRIMARY KEY (`idCategoria`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`subcategorias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`subcategorias` (
  `idSubcategoria` INT NOT NULL,
  `nomeSubcategoria` VARCHAR(45) NULL,
  `idCategoria` INT NOT NULL,
  PRIMARY KEY (`idSubcategoria`),
  INDEX `fk_subcategoria_categoria_idx` (`idCategoria` ASC),
  CONSTRAINT `fk_subcategoria_categoria`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`orcamentosAnuais`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`orcamentosAnuais` (
  `idOrcamentoAnual` INT NOT NULL,
  `valorOrcamentoAnual` DECIMAL(10,2) NOT NULL,
  `anoOrcamentoAnual` INT NOT NULL,
  `idCategoria` INT NOT NULL,
  PRIMARY KEY (`idOrcamentoAnual`, `idCategoria`),
  UNIQUE INDEX `ano_UNIQUE` (`anoOrcamentoAnual` ASC),
  INDEX `fk_orcamentoanual_categoria1_idx` (`idCategoria` ASC),
  CONSTRAINT `fk_orcamentoanual_categoria1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`orcamentosTri`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`orcamentosTri` (
  `idOrcamentoTri` INT NOT NULL,
  `valorOrcamentoTri` DECIMAL(10,2) NULL,
  `trimestreOrcamentoTri` INT NULL,
  `idOrcamentoAnual` INT NOT NULL,
  `idCategoria` INT NOT NULL,
  PRIMARY KEY (`idOrcamentoTri`, `idCategoria`),
  INDEX `fk_orcamentotri_orcamentoanual1_idx` (`idOrcamentoAnual` ASC),
  INDEX `fk_orcamentotri_categoria1_idx` (`idCategoria` ASC),
  CONSTRAINT `fk_orcamentotri_orcamentoanual1`
    FOREIGN KEY (`idOrcamentoAnual`)
    REFERENCES `mydb`.`orcamentosAnuais` (`idOrcamentoAnual`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_orcamentotri_categoria1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`cargos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`cargos` (
  `idCargo` INT(11) NOT NULL,
  `nomeCargo` VARCHAR(45) NULL,
  `prioridadeCargo` VARCHAR(45) NULL,
  PRIMARY KEY (`idCargo`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`usuarios` (
  `idUsuario` INT(11) NOT NULL,
  `nomeUsuario` VARCHAR(45) NULL,
  `emailUsuario` VARCHAR(45) NULL,
  `senhaUsuario` VARCHAR(45) NULL,
  `dataCadastro` DATETIME NULL,
  `idCargo` INT(11) NOT NULL,
  PRIMARY KEY (`idUsuario`),
  INDEX `fk_usuarios_cargos1_idx` (`idCargo` ASC),
  CONSTRAINT `fk_usuarios_cargos1`
    FOREIGN KEY (`idCargo`)
    REFERENCES `mydb`.`cargos` (`idCargo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tarefas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tarefas` (
  idTarefa INT(11) NOT NULL AUTO_INCREMENT,
  tituloTarefa VARCHAR(45) NULL,
  descricaoTarefa TEXT NULL,
  prioridadeTarefa VARCHAR(10) NULL, -- nova coluna
  dataInicio DATE NULL,
  dataFim DATE NULL,
  valorOpc DECIMAL(10,2) NULL,
  PRIMARY KEY (idTarefa),
  CHECK (prioridadeTarefa IN ('Alta', 'Média', 'Baixa')) 
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`usuarios_tarefas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`usuarios_tarefas` (
  `tarefas_idTarefa` INT(11) NOT NULL,
  `usuarios_idUsuario` INT(11) NOT NULL,
  `status` ENUM('pendente', 'em andamento', 'concluida') NOT NULL DEFAULT 'pendente',
  PRIMARY KEY (`tarefas_idTarefa`, `usuarios_idUsuario`),
  INDEX `fk_tarefas_has_usuarios_usuarios1_idx` (`usuarios_idUsuario`),
  INDEX `fk_tarefas_has_usuarios_tarefas1_idx` (`tarefas_idTarefa`),
  CONSTRAINT `fk_tarefas_has_usuarios_tarefas1`
    FOREIGN KEY (`tarefas_idTarefa`)
    REFERENCES `mydb`.`tarefas` (`idTarefa`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tarefas_has_usuarios_usuarios1`
    FOREIGN KEY (`usuarios_idUsuario`)
    REFERENCES `mydb`.`usuarios` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`lancamentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`lancamentos` (
  `idLancamento` INT(11) NOT NULL,
  `vencimentoLancamento` DATE NULL,
  `valorLancamento` DECIMAL(10,2) NULL,
  `classificacaoLancamento` VARCHAR(45) NULL,
  `pagamentoLancamento` DATE NULL,
  `statusLancamento` VARCHAR(45) NULL,
  `idCategoria` INT NOT NULL,
  `idSubcategoria` INT NOT NULL,
  PRIMARY KEY (`idLancamento`),
  INDEX `fk_lancamentos_categorias1_idx` (`idCategoria` ASC),
  INDEX `fk_lancamentos_subcategorias1_idx` (`idSubcategoria` ASC),
  CONSTRAINT `fk_lancamentos_categorias1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_lancamentos_subcategorias1`
    FOREIGN KEY (`idSubcategoria`)
    REFERENCES `mydb`.`subcategorias` (`idSubcategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`produtos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`produtos` (
  `idProduto` INT(11) NOT NULL,
  `nomeProduto` VARCHAR(45) NULL,
  `custoProduto` DECIMAL(10,2) NULL,
  `idSegmento` INT NOT NULL,
  `idSubsegmento` INT NOT NULL,
  PRIMARY KEY (`idProduto`, `idSegmento`),
  INDEX `fk_produtos_segmentos1_idx` (`idSegmento` ASC),
  INDEX `fk_produtos_subsegmentos1_idx` (`idSubsegmento` ASC),
  CONSTRAINT `fk_produtos_segmentos1`
    FOREIGN KEY (`idSegmento`)
    REFERENCES `mydb`.`segmentos` (`idSegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_produtos_subsegmentos1`
    FOREIGN KEY (`idSubsegmento`)
    REFERENCES `mydb`.`subsegmentos` (`idSubsegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`extratos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`extratos` (
  `idExtrato` INT(11) NOT NULL,
  `tipoExtrato` VARCHAR(45) NULL,
  `valorExtrato` DECIMAL(10,2) NULL,
  `dataExtrato` DATE NULL,
  `idTarefa` INT(11) NOT NULL,
  `idLancamento` INT(11) NOT NULL,
  `idCategoria` INT NOT NULL,
  `idSubcategoria` INT NOT NULL,
  `idProduto` INT(11) NOT NULL,
  PRIMARY KEY (`idExtrato`),
  INDEX `fk_extratos_tarefas1_idx` (`idTarefa` ASC),
  INDEX `fk_extratos_lancamentos1_idx` (`idLancamento` ASC),
  INDEX `fk_extratos_categorias1_idx` (`idCategoria` ASC),
  INDEX `fk_extratos_subcategorias1_idx` (`idSubcategoria` ASC),
  INDEX `fk_extratos_produtos1_idx` (`idProduto` ASC),
  CONSTRAINT `fk_extratos_tarefas1`
    FOREIGN KEY (`idTarefa`)
    REFERENCES `mydb`.`tarefas` (`idTarefa`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_lancamentos1`
    FOREIGN KEY (`idLancamento`)
    REFERENCES `mydb`.`lancamentos` (`idLancamento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_categorias1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_subcategorias1`
    FOREIGN KEY (`idSubcategoria`)
    REFERENCES `mydb`.`subcategorias` (`idSubcategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_produtos1`
    FOREIGN KEY (`idProduto`)
    REFERENCES `mydb`.`produtos` (`idProduto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;




SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `mydb`;
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8;
USE `mydb`;

-- -----------------------------------------------------
-- Table `mydb`.`segmentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`segmentos` (
  `idSegmento` INT NOT NULL AUTO_INCREMENT,
  `nomeSegmento` VARCHAR(45) NULL,
  PRIMARY KEY (`idSegmento`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`subsegmentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`subsegmentos` (
  `idSubsegmento` INT NOT NULL AUTO_INCREMENT,
  `nomeSubsegmento` VARCHAR(45) NULL,
  `idSegmento` INT NOT NULL,
  PRIMARY KEY (`idSubsegmento`),
  INDEX `fk_subsegmento_segmento1_idx` (`idSegmento`),
  CONSTRAINT `fk_subsegmento_segmento1`
    FOREIGN KEY (`idSegmento`)
    REFERENCES `mydb`.`segmentos` (`idSegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`indices`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`indices` (
  `idIndice` INT NOT NULL AUTO_INCREMENT,
  `nomeIndice` VARCHAR(45) NULL,
  `taxaIndice` DECIMAL(10,2) NULL,
  `idSubsegmento` INT NOT NULL,
  `anoIndice` VARCHAR(45) NULL,
  PRIMARY KEY (`idIndice`),
  UNIQUE INDEX `ano_UNIQUE` (`anoIndice`),
  INDEX `fk_rentabilidade_subsegmento1_idx` (`idSubsegmento`),
  CONSTRAINT `fk_rentabilidade_subsegmento1`
    FOREIGN KEY (`idSubsegmento`)
    REFERENCES `mydb`.`subsegmentos` (`idSubsegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`categorias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`categorias` (
  `idCategoria` INT NOT NULL AUTO_INCREMENT,
  `nomeCategoria` VARCHAR(45) NULL,
  PRIMARY KEY (`idCategoria`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`subcategorias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`subcategorias` (
  `idSubcategoria` INT NOT NULL AUTO_INCREMENT,
  `nomeSubcategoria` VARCHAR(45) NULL,
  `idCategoria` INT NOT NULL,
  PRIMARY KEY (`idSubcategoria`),
  INDEX `fk_subcategoria_categoria_idx` (`idCategoria`),
  CONSTRAINT `fk_subcategoria_categoria`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`orcamentosAnuais`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`orcamentosAnuais` (
  `idOrcamentoAnual` INT NOT NULL AUTO_INCREMENT,
  `valorOrcamentoAnual` DECIMAL(10,2) NOT NULL,
  `anoOrcamentoAnual` INT NOT NULL,
  `idCategoria` INT NOT NULL,
  PRIMARY KEY (`idOrcamentoAnual`, `idCategoria`),
  UNIQUE INDEX `ano_UNIQUE` (`anoOrcamentoAnual`),
  INDEX `fk_orcamentoanual_categoria1_idx` (`idCategoria`),
  CONSTRAINT `fk_orcamentoanual_categoria1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`orcamentosTri`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`orcamentosTri` (
  `idOrcamentoTri` INT NOT NULL AUTO_INCREMENT,
  `valorOrcamentoTri` DECIMAL(10,2) NULL,
  `trimestreOrcamentoTri` INT NULL,
  `idOrcamentoAnual` INT NOT NULL,
  `idCategoria` INT NOT NULL,
  PRIMARY KEY (`idOrcamentoTri`, `idCategoria`),
  INDEX `fk_orcamentotri_orcamentoanual1_idx` (`idOrcamentoAnual`),
  INDEX `fk_orcamentotri_categoria1_idx` (`idCategoria`),
  CONSTRAINT `fk_orcamentotri_orcamentoanual1`
    FOREIGN KEY (`idOrcamentoAnual`)
    REFERENCES `mydb`.`orcamentosAnuais` (`idOrcamentoAnual`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_orcamentotri_categoria1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`cargos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`cargos` (
  `idCargo` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeCargo` VARCHAR(45) NULL,
  `prioridadeCargo` VARCHAR(45) NULL,
  PRIMARY KEY (`idCargo`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`usuarios` (
  `idUsuario` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeUsuario` VARCHAR(45) NULL,
  `emailUsuario` VARCHAR(45) NULL,
  `senhaUsuario` VARCHAR(45) NULL,
  `dataCadastro` DATETIME NULL,
  `idCargo` INT(11) NOT NULL,
  PRIMARY KEY (`idUsuario`),
  INDEX `fk_usuarios_cargos1_idx` (`idCargo`),
  CONSTRAINT `fk_usuarios_cargos1`
    FOREIGN KEY (`idCargo`)
    REFERENCES `mydb`.`cargos` (`idCargo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`tarefas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tarefas` (
  `idTarefa` INT(11) NOT NULL AUTO_INCREMENT,
  `tituloTarefa` VARCHAR(45) NULL,
  `descricaoTarefa` TEXT NULL,
  `prioridadeTarefa` VARCHAR(10) NULL,
  `dataInicio` DATE NULL,
  `dataFim` DATE NULL,
  `valorOpc` DECIMAL(10,2) NULL,
  PRIMARY KEY (`idTarefa`),
  CHECK (`prioridadeTarefa` IN ('Alta', 'Média', 'Baixa'))
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`usuarios_tarefas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`usuarios_tarefas` (
  `tarefas_idTarefa` INT(11) NOT NULL,
  `usuarios_idUsuario` INT(11) NOT NULL,
  PRIMARY KEY (`tarefas_idTarefa`, `usuarios_idUsuario`),
  INDEX `fk_tarefas_has_usuarios_usuarios1_idx` (`usuarios_idUsuario`),
  INDEX `fk_tarefas_has_usuarios_tarefas1_idx` (`tarefas_idTarefa`),
  CONSTRAINT `fk_tarefas_has_usuarios_tarefas1`
    FOREIGN KEY (`tarefas_idTarefa`)
    REFERENCES `mydb`.`tarefas` (`idTarefa`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tarefas_has_usuarios_usuarios1`
    FOREIGN KEY (`usuarios_idUsuario`)
    REFERENCES `mydb`.`usuarios` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`lancamentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`lancamentos` (
  `idLancamento` INT(11) NOT NULL AUTO_INCREMENT,
  `vencimentoLancamento` DATE NULL,
  `valorLancamento` DECIMAL(10,2) NULL,
  `classificacaoLancamento` VARCHAR(45) NULL,
  `pagamentoLancamento` DATE NULL,
  `statusLancamento` VARCHAR(45) NULL,
  `idCategoria` INT NOT NULL,
  `idSubcategoria` INT NOT NULL,
  PRIMARY KEY (`idLancamento`),
  INDEX `fk_lancamentos_categorias1_idx` (`idCategoria`),
  INDEX `fk_lancamentos_subcategorias1_idx` (`idSubcategoria`),
  CONSTRAINT `fk_lancamentos_categorias1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_lancamentos_subcategorias1`
    FOREIGN KEY (`idSubcategoria`)
    REFERENCES `mydb`.`subcategorias` (`idSubcategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`produtos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`produtos` (
  `idProduto` INT(11) NOT NULL AUTO_INCREMENT,
  `nomeProduto` VARCHAR(45) NULL,
  `custoProduto` DECIMAL(10,2) NULL,
  `idSegmento` INT NOT NULL,
  `idSubsegmento` INT NOT NULL,
  PRIMARY KEY (`idProduto`),
  INDEX `fk_produtos_segmentos1_idx` (`idSegmento`),
  INDEX `fk_produtos_subsegmentos1_idx` (`idSubsegmento`),
  CONSTRAINT `fk_produtos_segmentos1`
    FOREIGN KEY (`idSegmento`)
    REFERENCES `mydb`.`segmentos` (`idSegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_produtos_subsegmentos1`
    FOREIGN KEY (`idSubsegmento`)
    REFERENCES `mydb`.`subsegmentos` (`idSubsegmento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`extratos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`extratos` (
  `idExtrato` INT(11) NOT NULL AUTO_INCREMENT,
  `tipoExtrato` VARCHAR(45) NULL,
  `valorExtrato` DECIMAL(10,2) NULL,
  `dataExtrato` DATE NULL,
  `idTarefa` INT(11) NOT NULL,
  `idLancamento` INT(11) NOT NULL,
  `idCategoria` INT NOT NULL,
  `idSubcategoria` INT NOT NULL,
  `idProduto` INT(11) NOT NULL,
  PRIMARY KEY (`idExtrato`),
  INDEX `fk_extratos_tarefas1_idx` (`idTarefa`),
  INDEX `fk_extratos_lancamentos1_idx` (`idLancamento`),
  INDEX `fk_extratos_categorias1_idx` (`idCategoria`),
  INDEX `fk_extratos_subcategorias1_idx` (`idSubcategoria`),
  INDEX `fk_extratos_produtos1_idx` (`idProduto`),
  CONSTRAINT `fk_extratos_tarefas1`
    FOREIGN KEY (`idTarefa`)
    REFERENCES `mydb`.`tarefas` (`idTarefa`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_lancamentos1`
    FOREIGN KEY (`idLancamento`)
    REFERENCES `mydb`.`lancamentos` (`idLancamento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_categorias1`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `mydb`.`categorias` (`idCategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_subcategorias1`
    FOREIGN KEY (`idSubcategoria`)
    REFERENCES `mydb`.`subcategorias` (`idSubcategoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extratos_produtos1`
    FOREIGN KEY (`idProduto`)
    REFERENCES `mydb`.`produtos` (`idProduto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Dados de exemplo para as tabelas da imagem
-- -----------------------------------------------------
INSERT INTO `mydb`.`segmentos` (`nomeSegmento`) VALUES
  ('Tecnologia'),
  ('Varejo');

INSERT INTO `mydb`.`subsegmentos` (`nomeSubsegmento`, `idSegmento`) VALUES
  ('Desenvolvimento de Software', 1),
  ('Comércio Eletrônico',        2);

INSERT INTO `mydb`.`categorias` (`nomeCategoria`) VALUES
  ('Infraestrutura'),
  ('Marketing');

INSERT INTO `mydb`.`subcategorias` (`nomeSubcategoria`, `idCategoria`) VALUES
  ('Servidores',    1),
  ('Redes Sociais', 2);

INSERT INTO `mydb`.`indices` (`nomeIndice`, `taxaIndice`, `idSubsegmento`, `anoIndice`) VALUES
  ('Índice de Crescimento TI',     5.75, 1, '2023'),
  ('Índice de Vendas E-commerce',  7.25, 2, '2024');

INSERT INTO tarefas (tituloTarefa, descricaoTarefa, prioridadeTarefa, dataInicio, dataFim, valorOpc)
VALUES ('Atualizar sistema', 'Corrigir bugs e melhorar performance', 'Alta', '2025-07-16', '2025-07-18', 0.00);

  -- Cargo: Administrador do Sistema
INSERT INTO cargos (nomeCargo, prioridadeCargo) 
VALUES ('Administrador do Sistema', '5');

-- Usuário: adm
INSERT INTO usuarios (nomeUsuario, emailUsuario, senhaUsuario, dataCadastro, idCargo)
VALUES ('adm', md5('adm@adm.com'), 'adm123456', NOW(), 1);

DROP TABLE IF EXISTS `mydb`.`usuarios_tarefas`;

CREATE TABLE IF NOT EXISTS `mydb`.`usuarios_tarefas` (
  `tarefas_idTarefa` INT(11) NOT NULL,
  `usuarios_idUsuario` INT(11) NOT NULL,
  `status` ENUM('pendente', 'em andamento', 'concluida') NOT NULL DEFAULT 'pendente',
  PRIMARY KEY (`tarefas_idTarefa`, `usuarios_idUsuario`),
  INDEX `fk_tarefas_has_usuarios_usuarios1_idx` (`usuarios_idUsuario`),
  INDEX `fk_tarefas_has_usuarios_tarefas1_idx` (`tarefas_idTarefa`),
  CONSTRAINT `fk_tarefas_has_usuarios_tarefas1`
    FOREIGN KEY (`tarefas_idTarefa`)
    REFERENCES `mydb`.`tarefas` (`idTarefa`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tarefas_has_usuarios_usuarios1`
    FOREIGN KEY (`usuarios_idUsuario`)
    REFERENCES `mydb`.`usuarios` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;