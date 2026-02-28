import React, { useState } from "react";
import { useGetBloodDonors, useAddBloodDonor } from "../hooks/useQueries";
import DonorCard from "../components/blood/DonorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Droplets, Search, Plus, X, Upload, CheckCircle, AlertCircle, ImageIcon } from "lucide-react";
import { detectBloodTypeFromText, BLOOD_TYPES } from "../utils/bloodTypeDetection";

type BloodTypeFilter = "All" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export default function BloodDonorPage() {
  const { data: donors = [], isLoading } = useGetBloodDonors();
  const addDonor = useAddBloodDonor();

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<BloodTypeFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [contact, setContact] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofText, setProofText] = useState("");
  const [detectedBloodType, setDetectedBloodType] = useState<string | null>(null);
  const [manualBloodType, setManualBloodType] = useState<string | null>(null);
  const [isImageFile, setIsImageFile] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const bloodTypeFilters: BloodTypeFilter[] = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const filteredDonors = donors.filter((d) => {
    const matchesFilter = filter === "All" || d.verifiedBloodType === filter;
    const matchesSearch =
      searchQuery === "" ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const confirmedBloodType = isImageFile ? manualBloodType : detectedBloodType;
  const canSubmit =
    name.trim() !== "" &&
    city.trim() !== "" &&
    contact.trim() !== "" &&
    proofFile !== null &&
    confirmedBloodType !== null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofFile(file);
    setDetectedBloodType(null);
    setManualBloodType(null);
    setDetectionError(null);
    setProofText("");

    const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name);
    setIsImageFile(isImage);

    if (isImage) {
      // For image files, do NOT attempt text analysis — show manual selector
      setProofText(file.name);
      return;
    }

    // For text-based files, read and analyze
    setIsAnalyzing(true);
    try {
      const text = await readFileAsText(file);
      setProofText(text);
      const detected = detectBloodTypeFromText(text);
      if (detected) {
        setDetectedBloodType(detected);
        setDetectionError(null);
      } else {
        setDetectionError(
          "Could not detect blood type from the uploaded proof. Please upload a document clearly showing your blood group (e.g. 'Blood Group: A+')."
        );
      }
    } catch {
      setDetectionError("Failed to read the file. Please try a different file.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const resetFormFields = () => {
    setName("");
    setCity("");
    setContact("");
    setProofFile(null);
    setProofText("");
    setDetectedBloodType(null);
    setManualBloodType(null);
    setIsImageFile(false);
    setDetectionError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !confirmedBloodType) return;

    try {
      await addDonor.mutateAsync({
        name: name.trim(),
        city: city.trim(),
        contact: contact.trim(),
        proofText,
        detectedBloodType: confirmedBloodType,
      });
      // mutateAsync throws on error, so reaching here means success
      resetFormFields();
      setShowForm(false);
    } catch {
      // error is handled by the mutation's onError toast
    }
  };

  const resetForm = () => {
    setShowForm(false);
    resetFormFields();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-r from-destructive/90 to-destructive text-destructive-foreground py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Droplets className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Blood Donor Registry</h1>
            <p className="text-destructive-foreground/80 mt-1">
              Connect donors with those in need. Every drop counts.
            </p>
          </div>
          <div className="sm:ml-auto">
            <Button
              onClick={() => setShowForm(!showForm)}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {showForm ? "Cancel" : "Register as Donor"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Registration Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-card-foreground mb-5 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-destructive" />
              Donor Registration
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="donor-name">Full Name *</Label>
                  <Input
                    id="donor-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="donor-city">City *</Label>
                  <Input
                    id="donor-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Your city"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="donor-contact">Contact Number *</Label>
                  <Input
                    id="donor-contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
              </div>

              {/* Proof Upload */}
              <div className="space-y-2">
                <Label htmlFor="proof-upload">Blood Group Proof Document *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-destructive/50 transition-colors">
                  <input
                    id="proof-upload"
                    type="file"
                    accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {proofFile ? proofFile.name : "Click to upload proof (TXT, PDF, DOC, JPG, PNG)"}
                    </span>
                  </label>
                </div>

                {/* Analyzing indicator */}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                    Analyzing document for blood type...
                  </div>
                )}

                {/* Image file: manual selector */}
                {isImageFile && proofFile && !isAnalyzing && (
                  <div className="space-y-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Image files cannot be analyzed automatically. Please select your blood type below.
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_TYPES.map((bt) => (
                        <button
                          key={bt}
                          type="button"
                          onClick={() => setManualBloodType(bt)}
                          className={`py-2 px-3 rounded-lg text-sm font-bold border-2 transition-all ${
                            manualBloodType === bt
                              ? "bg-destructive text-white border-destructive shadow-md scale-105"
                              : "bg-card text-card-foreground border-border hover:border-destructive/50"
                          }`}
                        >
                          {bt}
                        </button>
                      ))}
                    </div>
                    {manualBloodType && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Selected Blood Type: {manualBloodType}
                      </div>
                    )}
                  </div>
                )}

                {/* Text file: detected blood type */}
                {!isImageFile && detectedBloodType && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Detected Blood Type:{" "}
                      <span className="font-bold text-base">{detectedBloodType}</span>
                    </span>
                  </div>
                )}

                {/* Detection error */}
                {detectionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{detectionError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!canSubmit || addDonor.isPending}
                  className="bg-destructive hover:bg-destructive/90 text-white"
                >
                  {addDonor.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Droplets className="w-4 h-4 mr-2" />
                      Register as Donor
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search donors by name or city..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {bloodTypeFilters.map((bt) => (
              <button
                key={bt}
                onClick={() => setFilter(bt)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  filter === bt
                    ? "bg-destructive text-white border-destructive"
                    : "bg-card text-card-foreground border-border hover:border-destructive/50"
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>

        {/* Donor Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${filteredDonors.length} donor${filteredDonors.length !== 1 ? "s" : ""} found`}
          </p>
          {filter !== "All" && (
            <Badge variant="destructive">{filter}</Badge>
          )}
        </div>

        {/* Donor List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : filteredDonors.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Droplets className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No donors found</p>
            <p className="text-sm mt-1">
              {filter !== "All" ? `No ${filter} donors registered yet.` : "Be the first to register!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDonors.map((donor) => (
              <DonorCard key={String(donor.id)} donor={donor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
