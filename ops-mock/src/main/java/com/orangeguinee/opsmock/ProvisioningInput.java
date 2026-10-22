package com.orangeguinee.opsmock;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Parametres d'entree de l'action CREATION_ACTIVATION_PREPAID_AUC_4G
 * (memes noms de champs que ProvisioningInput du projet OPS).
 */
public class ProvisioningInput {

    @NotBlank(message = "Le requestId ne peut etre null")
    private String requestId;

    @NotNull(message = "Le typeAction doit etre defini. Utilisez ACTIVATION")
    private String typeAction;

    @NotBlank(message = "Le numero est obligatoire")
    @Size(min = 9, max = 9, message = "Le numero doit contenir 9 caracteres")
    private String numero;

    @NotBlank(message = "La sim est obligatoire")
    @Size(min = 15, max = 15, message = "La sim doit contenir 15 caracteres")
    private String sim;

    @NotNull(message = "Le profil est obligatoire")
    @Pattern(regexp = "(?i)prepaid|postpaid", message = "Le profil doit etre prepaid ou postpaid")
    private String profil;

    @NotBlank(message = "La cle ne doit pas etre vide")
    private String cle = "0";


    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
    public String getTypeAction() { return typeAction; }
    public void setTypeAction(String typeAction) { this.typeAction = typeAction; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getSim() { return sim; }
    public void setSIM(String sim) { this.sim = sim; }
    public String getProfil() { return profil; }
    public void setProfil(String profil) { this.profil = profil; }
    public String getCle() { return cle; }
    public void setCle(String cle) { this.cle = cle; }

}
